export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;
  push("return ");

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(",");

  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");

  return {
    code: context.node,
  };
}

function createCodegenContext() {
  const context = {
    node: "",
    push(source) {
      context.node += source;
    },
  };
  return context;
}

function genNode(node: any, context) {
  const { push } = context;
  push(`"${node.content}"`);
}
