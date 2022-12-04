import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context, ""));
}

function parseChildren(context, parentTag: string) {
  const nodes: any = [];
  let node;
  while (!isEnd(context, parentTag)) {
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s.startsWith("<")) {
      if (/[a-z]/.test(s[1])) {
        node = parseElement(context);
      }
    }

    // 说明是文本
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

// 判断是否已经解析到结尾
function isEnd(context, parentTag) {
  // 2 解析到最后一个标签
  if (parentTag && context.source.startsWith(`</${parentTag}>`)) {
    return true;
  }

  // 1.source 不存在的情况
  return !context.source;
}

function parseText(context) {
  // 找到文本 结尾索引
  let endIndex = context.source.length;
  const endTokens = ["{{", "</"];
  // 找到第一个文本类型的结尾
  for (let i = 0; i < endTokens.length; i++) {
    const endToken = endTokens[i];
    const index = context.source.indexOf(endToken);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  console.log(context.source);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

const enum TagType {
  Start,
  End,
}

function parseTextData(context: any, length: number) {
  const content = context.source.slice(0, length);

  advanceBy(context, content.length);
  return content;
}

function parseElement(context) {
  // 1、解析tag
  const element: any = parseTag(context, TagType.Start);

  // 处理内部逻辑
  element.children = parseChildren(context, element.tag);
  // 2、删除处理完成的代码
  parseTag(context, TagType.End);
  return element;
}

function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)>/i.exec(context.source);

  const tag = match[1];
  console.log(match);
  advanceBy(context, match[0].length);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  // {{message}}
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength);

  const content = rawContent.trim();
  // 移动到 }} 的下一个位置
  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context: any, len: number) {
  context.source = context.source.slice(len);
}

function createRoot(children) {
  return {
    children,
  };
}

function createParserContext(content: string): any {
  return {
    source: content,
  };
}
