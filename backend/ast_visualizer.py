def visualize_ast(node, indent=0):
    space = "  " * indent

    if isinstance(node, list):
        return "".join(visualize_ast(n, indent) for n in node)

    if node.__class__.__name__ == "Assign":
        return f"{space}Assign\n" + \
               f"{space}  Var: {node.var}\n" + \
               visualize_ast(node.value, indent + 1)

    elif node.__class__.__name__ == "Number":
        return f"{space}Number({node.value})\n"

    elif node.__class__.__name__ == "Variable":
        return f"{space}Variable({node.name})\n"

    elif node.__class__.__name__ == "BinOp":
        return f"{space}BinOp({node.op})\n" + \
               visualize_ast(node.left, indent + 1) + \
               visualize_ast(node.right, indent + 1)

    elif node.__class__.__name__ == "Print":
        return f"{space}Print\n" + \
               visualize_ast(node.expr, indent + 1)

    elif node.__class__.__name__ == "IfElse":
        result = f"{space}If\n"
        result += f"{space}  Condition:\n"
        result += visualize_ast(node.condition, indent + 2)

        result += f"{space}  Then:\n"
        for stmt in node.if_body:
            result += visualize_ast(stmt, indent + 2)

        result += f"{space}  Else:\n"
        for stmt in node.else_body:
            result += visualize_ast(stmt, indent + 2)

        return result

    elif node.__class__.__name__ == "WhileLoop":
        result = f"{space}While\n"
        result += f"{space}  Condition:\n"
        result += visualize_ast(node.condition, indent + 2)

        result += f"{space}  Body:\n"
        for stmt in node.body:
            result += visualize_ast(stmt, indent + 2)

        return result

    return f"{space}Unknown Node\n"