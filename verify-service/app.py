from fastapi import FastAPI
from pydantic import BaseModel
import ast
import json

app = FastAPI()


class VerifyRequest(BaseModel):
    task: str
    language: str
    code: str


def build_response(
    request: VerifyRequest,
    verdict: str,
    tests_passed: int,
    tests_failed: int,
    confidence: int,
    evidence: list[str]
):
    return {
        "service": "Verdict404",
        "task": request.task,
        "language": request.language.lower(),
        "verdict": verdict,
        "tests_passed": tests_passed,
        "tests_failed": tests_failed,
        "confidence": confidence,
        "evidence": evidence
    }


@app.get("/")
def health():
    return {
        "service": "Verdict404 Verification Engine",
        "status": "running",
        "version": "0.3",
        "supported_languages": [
            "python",
            "json"
        ],
        "supported_tasks": [
            "safe_divide",
            "validate_json"
        ]
    }


def verify_safe_divide(request: VerifyRequest):

    if request.language.lower() != "python":
        return build_response(
            request,
            "ERROR",
            0,
            0,
            0,
            [
                "safe_divide requires language 'python'."
            ]
        )

    try:
        tree = ast.parse(request.code)

    except SyntaxError as error:
        return build_response(
            request,
            "ERROR",
            0,
            1,
            100,
            [
                f"Python syntax error at line {error.lineno}."
            ]
        )

    divide_function = None

    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == "divide":
            divide_function = node
            break

    if divide_function is None:
        return build_response(
            request,
            "FAIL",
            0,
            4,
            100,
            [
                "Required function 'divide' was not found."
            ]
        )

    tests_passed = 0
    tests_failed = 0
    evidence = []

    if len(divide_function.args.args) == 2:
        tests_passed += 1
        evidence.append(
            "PASS: divide() accepts two parameters."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: divide() must accept exactly two parameters."
        )

    has_division = any(
        isinstance(node, ast.BinOp)
        and isinstance(node.op, ast.Div)
        for node in ast.walk(divide_function)
    )

    if has_division:
        tests_passed += 1
        evidence.append(
            "PASS: division operation detected."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: no division operation detected."
        )

    has_zero_guard = False

    for node in ast.walk(divide_function):
        if isinstance(node, ast.Compare):

            contains_zero = any(
                isinstance(value, ast.Constant)
                and value.value == 0
                for value in [
                    node.left,
                    *node.comparators
                ]
            )

            if contains_zero:
                has_zero_guard = True
                break

    if has_zero_guard:
        tests_passed += 1
        evidence.append(
            "PASS: zero-division guard detected."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: no explicit zero-division guard detected."
        )

    has_return = any(
        isinstance(node, ast.Return)
        for node in ast.walk(divide_function)
    )

    if has_return:
        tests_passed += 1
        evidence.append(
            "PASS: function returns a result."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: function does not return a result."
        )

    verdict = (
        "PASS"
        if tests_failed == 0
        else "FAIL"
    )

    confidence = round(
        (
            tests_passed
            / (
                tests_passed
                + tests_failed
            )
        ) * 100
    )

    return build_response(
        request,
        verdict,
        tests_passed,
        tests_failed,
        confidence,
        evidence
    )


def verify_json_output(request: VerifyRequest):

    if request.language.lower() != "json":
        return build_response(
            request,
            "ERROR",
            0,
            0,
            0,
            [
                "validate_json requires language 'json'."
            ]
        )

    try:
        data = json.loads(request.code)

    except json.JSONDecodeError as error:
        return build_response(
            request,
            "ERROR",
            0,
            1,
            100,
            [
                (
                    "Invalid JSON syntax at "
                    f"line {error.lineno}, "
                    f"column {error.colno}."
                )
            ]
        )

    if not isinstance(data, dict):
        return build_response(
            request,
            "FAIL",
            0,
            4,
            100,
            [
                "JSON root must be an object."
            ]
        )

    tests_passed = 0
    tests_failed = 0
    evidence = []

    if "name" in data:
        tests_passed += 1
        evidence.append(
            "PASS: required field 'name' exists."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: required field 'name' is missing."
        )

    if "age" in data:
        tests_passed += 1
        evidence.append(
            "PASS: required field 'age' exists."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: required field 'age' is missing."
        )

    if isinstance(data.get("name"), str):
        tests_passed += 1
        evidence.append(
            "PASS: 'name' is a string."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: 'name' must be a string."
        )

    if (
        isinstance(data.get("age"), int)
        and not isinstance(data.get("age"), bool)
    ):
        tests_passed += 1
        evidence.append(
            "PASS: 'age' is an integer."
        )
    else:
        tests_failed += 1
        evidence.append(
            "FAIL: 'age' must be an integer."
        )

    verdict = (
        "PASS"
        if tests_failed == 0
        else "FAIL"
    )

    confidence = round(
        (
            tests_passed
            / (
                tests_passed
                + tests_failed
            )
        ) * 100
    )

    return build_response(
        request,
        verdict,
        tests_passed,
        tests_failed,
        confidence,
        evidence
    )


@app.post("/run-tests")
def run_tests(request: VerifyRequest):

    if request.task == "safe_divide":
        return verify_safe_divide(request)

    if request.task == "validate_json":
        return verify_json_output(request)

    return build_response(
        request,
        "ERROR",
        0,
        0,
        0,
        [
            f"Unknown verification task: {request.task}"
        ]
    )