def visualize_ast(node, indent=0):
    space = "  " * indent

    # Handle list of statements
    if isinstance(node, list):
        result = ""
        for n in node:
            result += visualize_ast(n, indent)
        return result

    # Assignment
    if node.__class__.__name__ == "Assign":
        return f"{space}Assign\n" + \
               f"{space}  Var: {node.var}\n" + \
               visualize_ast(node.value, indent + 1)

    # Number
    elif node.__class__.__name__ == "Number":
        return f"{space}Number({node.value})\n"

    # Variable
    elif node.__class__.__name__ == "Variable":
        return f"{space}Variable({node.name})\n"

    # Binary Operation
    elif node.__class__.__name__ == "BinOp":
        return f"{space}BinOp({node.op})\n" + \
               visualize_ast(node.left, indent + 1) + \
               visualize_ast(node.right, indent + 1)

    # Print
    elif node.__class__.__name__ == "Print":
        return f"{space}Print\n" + \
               visualize_ast(node.expr, indent + 1)

    # If-Else
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

    # While Loop
    elif node.__class__.__name__ == "WhileLoop":
        result = f"{space}While\n"

        result += f"{space}  Condition:\n"
        result += visualize_ast(node.condition, indent + 2)

        result += f"{space}  Body:\n"
        for stmt in node.body:
            result += visualize_ast(stmt, indent + 2)

        return result

    return f"{space}Unknown Node\n"