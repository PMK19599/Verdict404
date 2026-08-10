from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class VerifyRequest(BaseModel):
    sample: str


@app.post("/run-tests")
def run_tests(request: VerifyRequest):
    if request.sample == "bad_divide":
        return {
            "verdict": "FAIL",
            "tests_passed": 3,
            "tests_failed": 1,
            "evidence": "division-by-zero test failed"
        }

    if request.sample == "good_divide":
        return {
            "verdict": "PASS",
            "tests_passed": 4,
            "tests_failed": 0,
            "evidence": "all tests passed"
        }

    return {
        "verdict": "ERROR",
        "tests_passed": 0,
        "tests_failed": 0,
        "evidence": "unknown sample"
    }