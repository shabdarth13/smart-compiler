import re

TOKEN_SPEC = [
    ('LET', r'\blet\b'),
    ('PRINT', r'\bprint\b'),
    ('IF', r'\bif\b'),
    ('ELSE', r'\belse\b'),
    ('WHILE', r'\bwhile\b'),
    ('TRUE', r'\btrue\b'),

    ('NUMBER', r'\d+'),
    ('ID', r'[a-zA-Z_]\w*'),

    ('ASSIGN', r'='),
    ('PLUS', r'\+'),
    ('MULT', r'\*'),
    ('DIV', r'/'),

    ('GT', r'>'),
    ('LT', r'<'),

    ('LPAREN', r'\('),
    ('RPAREN', r'\)'),
    ('LBRACE', r'\{'),
    ('RBRACE', r'\}'),

    ('SKIP', r'[ \t]+'),
]

master_pattern = '|'.join(f'(?P<{name}>{pattern})' for name, pattern in TOKEN_SPEC)

def tokenize(code):
    tokens = []
    lines = code.split('\n')

    for line_num, line in enumerate(lines, start=1):
        for match in re.finditer(master_pattern, line):
            kind = match.lastgroup
            value = match.group()

            if kind == 'SKIP':
                continue

            tokens.append((kind, value, line_num))

    return tokens