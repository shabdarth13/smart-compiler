from ast_nodes import *

MAX_ITERATIONS = 1000  
def eval_expr(node, env):
    if isinstance(node, Number):
        return node.value

    if isinstance(node, Variable):
        if node.name not in env:
            raise Exception(f"Semantic Error: Undefined variable '{node.name}'")
        return env[node.name]

    if isinstance(node, BinOp):
        left = eval_expr(node.left, env)
        right = eval_expr(node.right, env)

        if node.op == '+':
            return left + right

        elif node.op == '*':
            return left * right

        elif node.op == '/':
            if right == 0:
                raise Exception("Runtime Error: Division by zero")
            return left // right

        elif node.op == '<':
            return left < right

        elif node.op == '>':
            return left > right

    raise Exception("Invalid expression")
def execute(ast, env=None):
    if env is None:
        env = {}

    output = []

    def run_block(nodes):
        nonlocal output

        for node in nodes:
            # ASSIGNMENT
            if isinstance(node, Assign):
                env[node.var] = eval_expr(node.value, env)
            # PRINT
            elif isinstance(node, Print):
                val = eval_expr(node.expr, env)
                output.append(str(val))
            # IF-ELSE
            elif isinstance(node, IfElse):
                condition = eval_expr(node.condition, env)

                if condition:
                    run_block(node.if_body)
                else:
                    run_block(node.else_body)
            # WHILE LOOP (SAFE VERSION)
            elif isinstance(node, WhileLoop):
                loop_counter = 0

                while eval_expr(node.condition, env):
                    if loop_counter >= MAX_ITERATIONS:
                        raise Exception("⚠ Infinite loop detected - execution stopped")

                    run_block(node.body)

                    loop_counter += 1

    run_block(ast)
    return output