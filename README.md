
```bash
# Windows PowerShell
.venv\\Scripts\\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

Install dependencies and start the application:

```bash
pip install -r requirements.txt
python -m backend.app
```

Then open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser.

## API

### `POST /analyze`

Validates code through lexing, parsing, and semantic analysis.

Request:

```json
{ "code": "let total = 2 + 3" }
```

Success response:

```json
{ "status": "success", "errors": [] }
```

### `POST /run`

Validates and executes the program. A successful response includes program output, warnings, final symbols, and AST graph data.

```json
{
  "status": "success",
  "warnings": [],
  "output": ["5"],
  "symbols": { "total": 5 },
  "ast": { "nodes": [], "edges": [] }
}
```

## Language reference

Supported constructs:

| Feature | Syntax |
| --- | --- |
| Declaration | `let count = 10` |
| Reassignment | `count = count + 1` |
| Print | `print(count)` |
| Arithmetic | `+`, `*`, `/` |
| Comparisons | `<`, `>` |
| Conditional | `if (condition) { ... } else { ... }` |
| Loop | `while (condition) { ... }` |

Notes:

- Values are integer-based. Division uses integer division.
- `if` statements currently require an `else` block.
- Only the tokens listed above are part of the language; statements do not use semicolons.
- Loop execution is capped at 1,000 iterations to detect likely infinite loops.

Example:

```text
let a = 4
let b = 6
let total = a + b

if (total > 8) {
  print(total)
} else {
  print(a)
}
```

Expected output:

```text
10
```

## Implementation notes

- The optimizer constant-folds `+`, `*`, and non-zero `/` expressions when both operands are numeric literals inside assignment expressions.
- The security checker emits heuristic warnings; it does not prevent execution.
- The frontend's “AI Code Explanation bot” is implemented locally with JavaScript rules and the most recent execution result; it does not call an external AI service.

## Dependencies

- [Flask](https://flask.palletsprojects.com/) — web server and API
- [Flask-CORS](https://flask-cors.readthedocs.io/) — CORS support
- [Gunicorn](https://gunicorn.org/) — production WSGI server dependency

## License

No license file is present in the repository. Add a license before redistributing or accepting external contributions.
