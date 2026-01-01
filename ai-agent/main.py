from fastapi import FastAPI
from agents.code_reviewer.auditor import audit_code_quality
from pydantic import BaseModel

app = FastAPI()

class AuditRequest(BaseModel):
    repo_name: str
    code_content: str

@app.get("/")
def home():
    return {"message": "Forge AI Auditor is Online"}

@app.post("/audit")
def perform_audit(request: AuditRequest):
    result = audit_code_quality(request.repo_name, request.code_content)
    return {"audit_summary": result}
