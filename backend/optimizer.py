from ast_nodes import *

def optimize_node(node):
    if isinstance(node, BinOp):
        left = optimize_node(node.left)
        right = optimize_node(node.right)

        if isinstance(left, Number) and isinstance(right, Number):
            if node.op == '+':
                return Number(left.value + right.value)
            elif node.op == '*':
                return Number(left.value * right.value)
            elif node.op == '/' and right.value != 0:
                return Number(left.value // right.value)

        return BinOp(left, node.op, right)

    return node

def optimize(ast):
    return [Assign(n.var, optimize_node(n.value)) if isinstance(n, Assign) else n for n in ast]