from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ast
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
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

    # Task: validate_json (JSON)
    if request.task == "validate_json":
        if request.language.lower() != "json":
            return {
                "verdict": "ERROR",
                "tests_passed": 0,
                "tests_failed": 0,
                "confidence": 0,
                "evidence": [
                    "Only JSON verification is supported for task 'validate_json'."
                ]
            }

        try:
            parsed = json.loads(request.code)
        except Exception as error:
            return {
                "verdict": "ERROR",
                "tests_passed": 0,
                "tests_failed": 0,
                "confidence": 0,
                "evidence": [
                    f"JSON syntax error: {error}."
                ]
            }

        if not isinstance(parsed, dict):
            return {
                "verdict": "FAIL",
                "tests_passed": 0,
                "tests_failed": 4,
                "confidence": 0,
                "evidence": [
                    "FAIL: Top-level JSON payload must be an object."
                ]
            }

        tests_passed = 0
        tests_failed = 0
        evidence = []

        # Test 1: required field name exists
        if "name" in parsed:
            tests_passed += 1
            evidence.append("PASS: required field 'name' exists.")
        else:
            tests_failed += 1
            evidence.append("FAIL: required field 'name' is missing.")

        # Test 2: required field age exists
        if "age" in parsed:
            tests_passed += 1
            evidence.append("PASS: required field 'age' exists.")
        else:
            tests_failed += 1
            evidence.append("FAIL: required field 'age' is missing.")

        # Test 3: name is a string
        if isinstance(parsed.get("name"), str):
            tests_passed += 1
            evidence.append("PASS: 'name' is a string.")
        else:
            tests_failed += 1
            evidence.append("FAIL: 'name' must be a string.")

        # Test 4: age is an integer (and not boolean)
        if isinstance(parsed.get("age"), int) and not isinstance(parsed.get("age"), bool):
            tests_passed += 1
            evidence.append("PASS: 'age' is an integer.")
        else:
            tests_failed += 1
            evidence.append("FAIL: 'age' must be an integer.")

        verdict = "PASS" if tests_failed == 0 else "FAIL"
        confidence = round((tests_passed / (tests_passed + tests_failed)) * 100)

        return {
            "verdict": verdict,
            "tests_passed": tests_passed,
            "tests_failed": tests_failed,
            "confidence": confidence,
            "evidence": evidence
        }

    # Task: safe_divide (Python)
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
            "confidence": 0,
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