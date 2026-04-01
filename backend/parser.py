from ast_nodes import *

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def current(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def eat(self, token_type):
        token = self.current()
        if token and token[0] == token_type:
            self.pos += 1
            return token
        
        line = token[2] if token else "unknown"
        raise Exception(f"Syntax Error at line {line}: Expected {token_type}")

    def parse(self):
        statements = []
        while self.current():
            statements.append(self.statement())
        return statements

    def statement(self):
        token = self.current()

        if token[0] == 'LET':
            self.eat('LET')
            var = self.eat('ID')[1]
            self.eat('ASSIGN')
            return Assign(var, self.expr())

        elif token[0] == 'PRINT':
            self.eat('PRINT')
            self.eat('LPAREN')
            expr = self.expr()
            self.eat('RPAREN')
            return Print(expr)

        elif token[0] == 'IF':
            self.eat('IF')
            self.eat('LPAREN')
            cond = self.expr()
            self.eat('RPAREN')

            self.eat('LBRACE')
            if_body = []
            while self.current()[0] != 'RBRACE':
                if_body.append(self.statement())
            self.eat('RBRACE')

            self.eat('ELSE')
            self.eat('LBRACE')
            else_body = []
            while self.current()[0] != 'RBRACE':
                else_body.append(self.statement())
            self.eat('RBRACE')

            return IfElse(cond, if_body, else_body)

        elif token[0] == 'WHILE':
            self.eat('WHILE')
            self.eat('LPAREN')
            cond = self.expr()
            self.eat('RPAREN')

            self.eat('LBRACE')
            body = []
            while self.current()[0] != 'RBRACE':
                body.append(self.statement())
            self.eat('RBRACE')

            return WhileLoop(cond, body)

        elif token[0] == 'ID':
            var = self.eat('ID')[1]
            self.eat('ASSIGN')
            return Assign(var, self.expr())

        else:
            raise Exception(f"Unexpected token {token}")

    def expr(self):
        node = self.term()

        while self.current() and self.current()[0] == 'PLUS':
            op = self.eat('PLUS')[1]
            node = BinOp(node, op, self.term())

        if self.current() and self.current()[0] in ('GT', 'LT'):
            op = self.eat(self.current()[0])[1]
            node = BinOp(node, op, self.term())

        return node

    def term(self):
        node = self.factor()

        while self.current() and self.current()[0] in ('MULT', 'DIV'):
            op = self.eat(self.current()[0])[1]
            node = BinOp(node, op, self.factor())

        return node

    def factor(self):
        token = self.current()

        if token[0] == 'NUMBER':
            return Number(self.eat('NUMBER')[1])

        elif token[0] == 'ID':
            return Variable(self.eat('ID')[1])

        elif token[0] == 'LPAREN':
            self.eat('LPAREN')
            node = self.expr()
            self.eat('RPAREN')
            return node

        else:
            raise Exception(f"Invalid expression at line {token[2]}")