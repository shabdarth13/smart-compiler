class Assign:
    def __init__(self, var, value):
        self.var = var
        self.value = value

class Number:
    def __init__(self, value):
        self.value = int(value)

class Variable:
    def __init__(self, name):
        self.name = name

class BinOp:
    def __init__(self, left, op, right):
        self.left = left
        self.op = op
        self.right = right

class Print:
    def __init__(self, expr):
        self.expr = expr

class IfElse:
    def __init__(self, condition, if_body, else_body):
        self.condition = condition
        self.if_body = if_body
        self.else_body = else_body

class WhileLoop:
    def __init__(self, condition, body):
        self.condition = condition
        self.body = body