from flask import Flask, request, jsonify
from flask_cors import CORS

from lexer import tokenize
from parser import Parser
from semantic import semantic_analysis
from security import security_check
from optimizer import optimize
from executor import execute
from ast_visualizer import visualize_ast

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        code = request.json['code']

        tokens = tokenize(code)
        parser = Parser(tokens)
        ast = parser.parse()

        semantic_analysis(ast)

        return jsonify({
            "status": "success",
            "errors": []
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "errors": [str(e)]
        })

@app.route('/run', methods=['POST'])
def run():
    try:
        code = request.json['code']

        tokens = tokenize(code)
        parser = Parser(tokens)
        ast = parser.parse()

        symbols = semantic_analysis(ast)
        warnings = security_check(ast)

        optimized_ast = optimize(ast)
        output = execute(optimized_ast)

        ast_tree = visualize_ast(optimized_ast)

        return jsonify({
            "status": "success",
            "warnings": warnings,
            "output": output,
            "ast": ast_tree,
            "symbols": symbols
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "errors": [str(e)]
        })

if __name__ == '__main__':
    app.run(debug=True)