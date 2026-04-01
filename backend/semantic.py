from ast_nodes import *

def semantic_analysis(ast):
    symbols = {}

    def visit(node):
        if isinstance(node, list):
            for n in node:
                visit(n)

        elif isinstance(node, Assign):
            value = evaluate(node.value)
            symbols[node.var] = value

        elif isinstance(node, Variable):
            if node.name not in symbols:
                raise Exception(f"Semantic Error: Undefined variable '{node.name}'")

        elif isinstance(node, BinOp):
            visit(node.left)
            visit(node.right)

        elif isinstance(node, Print):
            visit(node.expr)

        elif isinstance(node, IfElse):
            visit(node.condition)
            for stmt in node.if_body:
                visit(stmt)
            for stmt in node.else_body:
                visit(stmt)

        elif isinstance(node, WhileLoop):
            visit(node.condition)
            for stmt in node.body:
                visit(stmt)

    def evaluate(node):
        if isinstance(node, Number):
            return node.value
        elif isinstance(node, Variable):
            if node.name not in symbols:
                raise Exception(f"Semantic Error: Undefined variable '{node.name}'")
            return symbols[node.name]
        elif isinstance(node, BinOp):
            left = evaluate(node.left)
            right = evaluate(node.right)

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

    visit(ast)
    return symbols