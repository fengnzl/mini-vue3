'use strict';

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const hasOwn = (target, key) => {
    return Object.prototype.hasOwnProperty.call(target, key);
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (match, p1) => p1 ? p1.toUpperCase() : "");
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? `on${capitalize(str)}` : "";
};

// 当前的副作用函数
let activeEffect;
// 是否应该收集依赖
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.isActive = true;
        this._fn = fn;
    }
    // 运行副作用函数
    run() {
        // 如果调用 stop 函数之后 手动调用 runner 函数
        if (!this.isActive) {
            // 重置 isActive 和 shouldTrack 状态，执行 runner 函数之后 重新访问属性可以收集依赖
            this.isActive = true;
            shouldTrack = true;
            return this._fn();
        }
        // 否则说明当前是可收集的状态
        shouldTrack = true;
        activeEffect = this;
        // 获取调用函数的返回值
        const res = this._fn();
        // 重制可收集状态
        shouldTrack = false;
        return res;
    }
    stop() {
        // 调用 stop 方法 cleanupEffect 只执行一次
        if (this.isActive) {
            // 如果 onStop 存在 则会调用一次 onStop
            if (this.onStop) {
                this.onStop();
            }
            cleanupEffect(this);
            this.isActive = false;
        }
    }
}
// 从收集了 effect 的 deps 中删除 effect
function cleanupEffect(effect) {
    effect.deps.forEach((deps) => {
        deps.delete(effect);
    });
    // 由于当前 effect 的 deps 已经清空 所以可以直接清空
    effect.deps.length = 0;
}
const targetMap = new WeakMap();
// 收集依赖
// WeakMap -> Map -> Set
function track(target, key) {
    // 如果没有副作用函数或者不是收集的状态 说明无需依赖需要收集
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    trackEffects(deps);
}
function trackEffects(deps) {
    // 如果已经收集 则无需重复收集
    if (deps.has(activeEffect))
        return;
    deps.add(activeEffect);
    // 将 deps 添加到 activeEffect.deps 用于 stop 函数时将依赖删除
    activeEffect.deps.push(deps);
}
// 是否是正在收集依赖
function isTracking() {
    return activeEffect !== undefined && shouldTrack;
}
// 触发更新
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const deps = depsMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    // 获取 key 所对应的依赖执行
    deps.forEach((effect) => {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    // 执行副作用函数 其中访问对象时会进行依赖收集
    _effect.run();
    // 返回 runner 函数
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

function createGretter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        // 获取值
        const val = Reflect.get(target, key);
        if (!isReadonly) {
            // 收集依赖
            track(target, key);
        }
        // 如果是 shallow 则无需对子属性做操作
        if (isShallow) {
            return val;
        }
        // 如果属性值是对象，则递归转换成 reactive 或 readonly
        if (isObject(val)) {
            return isReadonly ? readonly(val) : reactive(val);
        }
        return val;
    };
}
function createSetter() {
    return function set(target, key, newVal) {
        const res = Reflect.set(target, key, newVal);
        // 触发更新
        trigger(target, key);
        return res;
    };
}
const get = createGretter();
const set = createSetter();
const readonlyGet = createGretter(true);
const shallowReadonlyGet = createGretter(true, true);
const mutableHandler = {
    get,
    set,
};
const readonlyHandler = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`Set operation on key "${key}" failed: target is readonly`);
        return true;
    },
};
const shallowReadonlyHandler = extend({}, readonlyHandler, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createActiveObject(raw, mutableHandler);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandler);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandler);
}
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} is not an object`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // TPP
    // 先写一个特性的行为 =》 重构成通用行为
    // add -> Add
    // add-foo -> addFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

const initProps = (instance, rawProps) => {
    instance.props = rawProps || {};
    // TODO 处理 $attrs
};

// 通用属性对应的获取方法
// 如 $el, $data 等
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 先判断属性是否是 setupState 中，如果存在则 直接返回 setupState 中的值
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    // const slots = {};
    // for (let key in children) {
    //   const val = children[key];
    //   slots[key] = Array.isArray(val) ? val : [val];
    // }
    // return slots;
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (let key in children) {
        // slot 函数
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

class RefImpl {
    constructor(value) {
        this.dep = new Set();
        this.__v__isRef = true;
        // 如果是对象 则需要使用 reactive 将内部属性都转换为 响应式
        this._value = convert(value);
        this._rawValue = value;
    }
    // 属性访问器
    get value() {
        // 访问属性时 需要进行依赖收集
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        // 对比 value 值是否发生变化
        if (hasChanged(this._rawValue, newVal)) {
            // 先设置值，再去触发
            this._rawValue = newVal;
            this._value = convert(newVal);
            // 设置变量的时候，触发依赖
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v__isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(obj) {
    return new Proxy(obj, {
        get(taget, key) {
            // 如果属性值是 ref 则返回 ref.value 否值直接返回 属性值
            return unRef(Reflect.get(taget, key));
        },
        set(target, key, newVal) {
            // 如果属性值是 ref 且变化后的值不是 ref 则需要通过 .value 进行改变
            if (isRef(target[key]) && !isRef(newVal)) {
                return (target[key].value = newVal);
            }
            else {
                return Reflect.set(target, key, newVal);
            }
        },
    });
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // 代理 proxy ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    if (setup) {
        setCurrentInstance(instance);
        // setup 函数可能返回一个函数或者对象
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function or object
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVnode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // 根据 children 再次处理 shapeFlage
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 如果是组件，且children 为对象，则认为其是 SLOT_CHILDREN 类型
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(str) {
    return createVnode(Text, {}, str);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            // 接收挂载点
            mount(rootContainer) {
                // 先转换成 vnode
                // 后续逻辑处理基于 vnode 进行处理
                const vnode = createVnode(rootComponent);
                // 渲染
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // 调用 patch 方法
        // 第一渲染 老 vnode 为 null
        patch(null, vnode, container, null);
    }
    // n1 老的 vnode， n2 新的 vnode
    function patch(n1, n2, container, parentComponent) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 如果是 element
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        // 更新 props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        // 数组变文本
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 清空 children
                unmountChildren(n1.children);
            }
            // 设置文本内容
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // 文本变数组的情况
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 清空children
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent);
            }
            else {
                // 文本变文本
                if (c1 !== c2) {
                    hostSetElementText(container, c2);
                }
            }
        }
    }
    function unmountChildren(children) {
        children.forEach((child) => {
            const el = child.el;
            hostRemove(el);
        });
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps === newProps)
            return;
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            // 两者不同才做更新
            if (prevProp !== nextProp) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        // 判断老的 props 中 key 被删除情况
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { props, children, shapeFlag } = vnode;
        // props
        // 以 on 开头的当作是事件处理 如 onClick 事件
        if (isObject(props)) {
            for (const key of Object.keys(props)) {
                const val = props[key];
                // const isOn = (key) => /^on[A-Z]/.test(key);
                // if (isOn(key)) {
                //   // 获取事件名称
                //   const event = key.slice(2).toLowerCase();
                //   el.addEventListener(event, val);
                // } else {
                //   el.setAttribute(key, val);
                // }
                hostPatchProp(el, key, null, val);
            }
        }
        // children
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((child) => patch(null, child, container, parentComponent));
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        // 获取组件的实例
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        // 进行渲染时的依赖收集，从而可以在改变的时候触发
        effect(() => {
            // 只能初始化一次，后续都是更新
            if (!instance.isMounted) {
                console.log("init");
                // 将 render 方法的 this 绑定为 instance 的 proxy 代理对象
                // 从而在 h 方法中可以使用 this 获取setup 返回的属性和方法
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 虚拟节点树 调用 patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance);
                // 将虚拟节点树 mountElement 时创建的 dom 树挂载到 vnode.el 属性
                // 从而可以通过 this.$el 可以获取组件的 root dom 节点
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("updated");
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevTree = instance.subTree;
                patch(prevTree, subTree, container, instance);
                instance.subTree = subTree;
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function provide(key, value) {
    // 存入 provide 数据
    const currentInstacne = getCurrentInstance();
    let { provides } = currentInstacne;
    const parentProvides = currentInstacne.parent.provides;
    // 因为在 component 初始化的时候判断父组件存在 provides 则当前组件的 provides 即为 parent.provides
    // 导致当前组件与父组件存在同名  provide key 时，会对父组件 provide 的数据进行覆盖
    // 从而在当前组件引入 inject 同名 key 的值不是父组件 provide 下来的数据
    // 需要判断当前组件 provides 是否与父组件 provides 相等，如果相等代表是第一次赋值，此时我们将父组件的 provides 作为当前组件 provides 的原型
    if (provides === parentProvides) {
        provides = currentInstacne.provides = Object.create(parentProvides);
    }
    provides[key] = value;
}
function inject(key, defaultValue) {
    // 取出对应的数据
    const currentInstance = getCurrentInstance();
    const provides = currentInstance.parent.provides;
    if (key in provides) {
        return provides[key];
    }
    else if (defaultValue !== undefined) {
        // defaultValue 可能是一个函数
        if (typeof defaultValue === "function") {
            return defaultValue();
        }
        return defaultValue;
    }
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVnode(Fragment, {}, slot(props));
        }
    }
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, oldVal, newVal) {
    // 以 on 开头的当作是事件处理 如 onClick 事件
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 获取事件名称
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, newVal);
    }
    else {
        // newVal 为 null 或者 undefined 删除 key
        if (newVal === null || newVal === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newVal);
        }
    }
}
function insert(el, parent) {
    parent.append(el);
}
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
