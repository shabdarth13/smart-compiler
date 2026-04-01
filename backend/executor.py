from ast_nodes import *

def eval_expr(node, env):
    if isinstance(node, Number):
        return node.value

    if isinstance(node, Variable):
        if node.name not in env:
            raise Exception(f"Undefined variable {node.name}")
        return env[node.name]

    if isinstance(node, BinOp):
        left = eval_expr(node.left, env)
        right = eval_expr(node.right, env)

        if node.op == '+':
            return left + right
        elif node.op == '*':
            return left * right
        elif node.op == '/':
            return left // right
        elif node.op == '<':
            return left < right
        elif node.op == '>':
            return left > right

def execute(ast, env=None):
    if env is None:
        env = {}

    output = []

    for node in ast:

        if isinstance(node, Assign):
            env[node.var] = eval_expr(node.value, env)

        elif isinstance(node, Print):
            output.append(str(eval_expr(node.expr, env)))

        elif isinstance(node, IfElse):
            if eval_expr(node.condition, env):
                out = execute(node.if_body, env)
            else:
                out = execute(node.else_body, env)
            output.extend(out)

        elif isinstance(node, WhileLoop):
            while eval_expr(node.condition, env):
                out = execute(node.body, env)
                output.extend(out)

    return output