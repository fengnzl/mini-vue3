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
    $props: (i) => i.props,
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
        update: null,
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
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
        component: null, // 组件实例
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

function shouldUpdateComponent(n1, n2) {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    for (let key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // 调用 patch 方法
        // 第一渲染 老 vnode 为 null
        patch(null, vnode, container, null, null);
    }
    // n1 老的 vnode， n2 新的 vnode
    function patch(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 如果是 element
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        // 更新 props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
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
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 数组变数组
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        // 左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            //  同一种类型 对比内部 props children
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多创建
        if (i > e1) {
            if (i <= e2) {
                // 处理新的在头部的情况
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i >= e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            const s1 = i;
            const s2 = i;
            // 记录已经 patch 的数量  当大于等于需要 patched 个数 则直接删除原节点即可
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            // 记录新旧节点中间 diff vnode 对应的索引值，默认 0 代表新增
            const newIndexToOldIndexMap = Array(toBePatched).fill(0);
            // 代表节点是否移动
            let moved = false;
            let maxNewIndexSoFar = 0;
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 如果新的节点已经 patch 完，直接 remove 旧节点
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                // 如果 前一个 key 值 为 null 或 undefined 则需要遍历查找是否存在重复的
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = s2;
                            break;
                        }
                    }
                }
                // 如果新节点在老节点中不存在
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    // 判断是否存在移动
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 更新旧节点位置对应新节点位置
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 这里只是找到中间节点并更新内容，但位置没有进行更新
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 获取最长递增子序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // 倒叙更新，确保 vnode 移动的时候 anchor 是稳定的
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                // 获取插入位置的锚点
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 说明新节点在老的里面不存在
                    // 需要创建
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        console.log("插入节点");
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 命中 index 和最长子序列的值 所以 j--
                        j--;
                    }
                }
            }
        }
    }
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
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
    function mountElement(vnode, container, parentComponent, anchor) {
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
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((child) => patch(null, child, container, parentComponent, anchor));
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        // 当就 VNode 不存在时，为挂载组件，否则是更新组件
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        // 获取组件实例
        const instance = (n2.component = n1.component);
        // 判断是否更新 props, 从而决定是否调用组件的更新函数，
        // 否则父组件更新，无论props 变化都会去更新子组件
        if (shouldUpdateComponent(n1, n2)) {
            // 将将要更新的虚拟节点挂载到 实例上，从而调用 更新函数时可以更新 props
            instance.next = n2;
            // 调用更新函数
            instance.update();
        }
        else {
            // 更新虚拟节点信息,及实例上的虚拟节点为最新
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        // 获取组件的实例 并将组件实例 挂载到 VNode component 上
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        // 进行渲染时的依赖收集，从而可以在改变的时候触发
        // 将 effect 返回的runner 函数挂载到 instance 上从而更新 component 时可以调用
        instance.update = effect(() => {
            // 只能初始化一次，后续都是更新
            if (!instance.isMounted) {
                console.log("init");
                // 将 render 方法的 this 绑定为 instance 的 proxy 代理对象
                // 从而在 h 方法中可以使用 this 获取setup 返回的属性和方法
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 虚拟节点树 调用 patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // 将虚拟节点树 mountElement 时创建的 dom 树挂载到 vnode.el 属性
                // 从而可以通过 this.$el 可以获取组件的 root dom 节点
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("updated");
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy);
                const prevTree = instance.subTree;
                patch(prevTree, subTree, container, instance, anchor);
                instance.subTree = subTree;
            }
        }, {
            scheduler() {
                console.log("scheduler update");
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    // 更新虚拟节点
    instance.vnode = nextVNode;
    //将实例上下一个虚拟节点清空
    instance.next = null;
    // 更新props
    instance.props = nextVNode.props;
}
// arr: 位置数组；
// 返回位置数组的递增子系列
function getSequence(arr) {
    // 拷贝一个数组 p，p[i]记录的是result在arr[i]更新前记录的上一个值,保存当前项对应的前一项的索引
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        // 遍历位置数组
        // 排除等于 0 的情况
        if (arrI !== 0) {
            j = result[result.length - 1];
            // (1) arrI 比 arr[j]大（当前值大于上次最长子系列的末尾值），直接添加
            if (arr[j] < arrI) {
                // 最后一项与 p 对应的索引进行对应, 保存上一次最长递增子系列的最后一个值的索引
                p[i] = j;
                // result 存储的是长度为 i 的递增子序列最小末尾值的索引集合
                result.push(i);
                continue;
            }
            // (2) arrI <= arr[j] 通过二分查找，找到后替换它；u和v相等时循环停止
            // 定义二分查找区间[u, v]
            u = 0;
            v = result.length - 1;
            // 开启二分查找
            while (u < v) {
                // 取整得到当前位置
                c = ((u + v) / 2) | 0;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            // 比较 => 替换, 当前子系列从头找到第一个大于当前值arrI，并替换
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    // 与p[i] = j作用一致
                    // 有可能替换会导致结果不正确，需要一个新数组 p 记录正确的结果
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    // 下面主要的修正由于贪心算法可能造成的最长递增子系列在原系列中不是正确的顺序
    u = result.length;
    v = result[u - 1];
    // 倒叙回溯 用 p 覆盖 result 进而找到最终正确的索引
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
function insert(child, parent, anchor) {
    // parent.append(child);
    parent.insertBefore(child, anchor || null);
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

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, renderSlots };
