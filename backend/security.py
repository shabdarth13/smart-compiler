from ast_nodes import *

def security_check(ast):
    warnings = []

    for node in ast:
        if isinstance(node, Assign) and node.var == "password":
            warnings.append("⚠ Hardcoded password detected")

        if isinstance(node, WhileLoop):
            warnings.append("⚠ Possible infinite loop detected")

        if isinstance(node, Assign):
            if isinstance(node.value, BinOp):
                if node.value.op == '/' and isinstance(node.value.right, Number) and node.value.right.value == 0:
                    warnings.append("⚠ Division by zero risk")

    return warnings