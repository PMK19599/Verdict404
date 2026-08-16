from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ast

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VerifyRequest(BaseModel):
    task: str
    language: str
    code: str


@app.get("/")
def health():
    return {
        "service": "Verdict404 Verification Engine",
        "status": "running"
    }


@app.post("/run-tests")
def run_tests(request: VerifyRequest):

    if request.language.lower() != "python":
        return {
            "verdict": "ERROR",
            "tests_passed": 0,
            "tests_failed": 0,
            "confidence": 0,
            "evidence": [
                "Only Python verification is supported in the current MVP."
            ]
        }

    if request.task != "safe_divide":
        return {
            "verdict": "ERROR",
            "tests_passed": 0,
            "tests_failed": 0,
            "confidence": 0,
            "evidence": [
                f"Unknown verification task: {request.task}"
            ]
        }

    try:
        tree = ast.parse(request.code)
    except SyntaxError as error:
        return {
            "verdict": "ERROR",
            "tests_passed": 0,
            "tests_failed": 1,
            "confidence": 100,
            "evidence": [
                f"Python syntax error at line {error.lineno}."
            ]
        }

    divide_function = None

    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == "divide":
            divide_function = node
            break

    if divide_function is None:
        return {
            "verdict": "FAIL",
            "tests_passed": 0,
            "tests_failed": 4,
            "confidence": 100,
            "evidence": [
                "Required function 'divide' was not found."
            ]
        }

    tests_passed = 0
    tests_failed = 0
    evidence = []

    # Test 1: function must accept exactly two parameters
    if len(divide_function.args.args) == 2:
        tests_passed += 1
        evidence.append("PASS: divide() accepts two parameters.")
    else:
        tests_failed += 1
        evidence.append("FAIL: divide() must accept exactly two parameters.")

    # Test 2: function must perform division
    has_division = any(
        isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div)
        for node in ast.walk(divide_function)
    )

    if has_division:
        tests_passed += 1
        evidence.append("PASS: division operation detected.")
    else:
        tests_failed += 1
        evidence.append("FAIL: no division operation detected.")

    # Test 3: code should explicitly check the divisor against zero
    has_zero_guard = False

    for node in ast.walk(divide_function):
        if isinstance(node, ast.Compare):
            contains_zero = any(
                isinstance(value, ast.Constant) and value.value == 0
                for value in [node.left, *node.comparators]
            )

            if contains_zero:
                has_zero_guard = True
                break

    if has_zero_guard:
        tests_passed += 1
        evidence.append("PASS: zero-division guard detected.")
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: no explicit zero-division guard detected."
        )

    # Test 4: function must return a value
    has_return = any(
        isinstance(node, ast.Return)
        for node in ast.walk(divide_function)
    )

    if has_return:
        tests_passed += 1
        evidence.append("PASS: function returns a result.")
    else:
        tests_failed += 1
        evidence.append("FAIL: function does not return a result.")

    verdict = "PASS" if tests_failed == 0 else "FAIL"

    confidence = round(
        (tests_passed / (tests_passed + tests_failed)) * 100
    )

    return {
        "verdict": verdict,
        "tests_passed": tests_passed,
        "tests_failed": tests_failed,
        "confidence": confidence,
        "evidence": evidence
    }