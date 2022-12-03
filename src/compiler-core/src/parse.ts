import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];
  let node;
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s.startsWith("<")) {
    node = parseElement(context);
  }

  nodes.push(node);

  return nodes;
}

const enum TagType {
  Start,
  End,
}

function parseElement(context) {
  // 1、解析tag
  const element = parseTag(context, TagType.Start);
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
  const rawContent = context.source.slice(0, rawContentLength);

  const content = rawContent.trim();
  // 移动到 }} 的下一个位置
  advanceBy(context, rawContentLength + closeDelimiter.length);

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
