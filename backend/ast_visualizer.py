def visualize_ast(ast):
    nodes = []
    edges = []
    counter = {"id": 0}

    def new_node(label):
        node_id = f"node{counter['id']}"
        counter["id"] += 1
        nodes.append({
            "id": node_id,
            "label": label
        })
        return node_id

    def visit(node, parent=None):
        if isinstance(node, list):
            root_id = new_node("Program")

            for stmt in node:
                child_id = visit(stmt, root_id)
                edges.append({
                    "from": root_id,
                    "to": child_id
                })

            return root_id

        node_type = node.__class__.__name__

        if node_type == "Assign":
            assign_id = new_node("Assign")

            var_id = new_node(f"Var: {node.var}")
            edges.append({
                "from": assign_id,
                "to": var_id
            })

            value_id = visit(node.value, assign_id)
            edges.append({
                "from": assign_id,
                "to": value_id
            })

            return assign_id

        elif node_type == "Number":
            return new_node(f"Number: {node.value}")

        elif node_type == "Variable":
            return new_node(f"Variable: {node.name}")

        elif node_type == "BinOp":
            op_id = new_node(f"BinOp: {node.op}")

            left_id = visit(node.left, op_id)
            right_id = visit(node.right, op_id)

            edges.append({
                "from": op_id,
                "to": left_id
            })

            edges.append({
                "from": op_id,
                "to": right_id
            })

            return op_id

        elif node_type == "Print":
            print_id = new_node("Print")
            expr_id = visit(node.expr, print_id)

            edges.append({
                "from": print_id,
                "to": expr_id
            })

            return print_id

        elif node_type == "IfElse":
            if_id = new_node("If-Else")

            cond_id = visit(node.condition, if_id)
            edges.append({
                "from": if_id,
                "to": cond_id,
                "label": "condition"
            })

            then_id = new_node("Then")
            edges.append({
                "from": if_id,
                "to": then_id
            })

            for stmt in node.if_body:
                stmt_id = visit(stmt, then_id)
                edges.append({
                    "from": then_id,
                    "to": stmt_id
                })

            else_id = new_node("Else")
            edges.append({
                "from": if_id,
                "to": else_id
            })

            for stmt in node.else_body:
                stmt_id = visit(stmt, else_id)
                edges.append({
                    "from": else_id,
                    "to": stmt_id
                })

            return if_id

        elif node_type == "WhileLoop":
            while_id = new_node("While")

            cond_id = visit(node.condition, while_id)
            edges.append({
                "from": while_id,
                "to": cond_id,
                "label": "condition"
            })

            body_id = new_node("Body")
            edges.append({
                "from": while_id,
                "to": body_id
            })

            for stmt in node.body:
                stmt_id = visit(stmt, body_id)
                edges.append({
                    "from": body_id,
                    "to": stmt_id
                })

            return while_id

        return new_node("Unknown")

    visit(ast)

    return {
        "nodes": nodes,
        "edges": edges
    }