import os
from google import genai

# Hardcoded for study purposes as requested
STUDY_KEY = "AlzaSyCOFhC6uMDtule-MA3Hez9Sf-_efcsKvGc"

client = genai.Client(api_key=STUDY_KEY)

def audit_code_quality(repo_name, code_snippet):
    try:
        prompt = f"""
        You are a Senior Software Architect. Audit the following project: {repo_name}
        Analyze this code snippet for:
        1. Complexity (1-10)
        2. Best Practices (1-10)
        3. Security (1-10)
        
        Provide a "Real-World XP" score and a brief justification.
        
        Code:
        {code_snippet}
        """
        
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        
        return response.text
    except Exception as e:
        return f"Audit Error: {str(e)}"

if __name__ == "__main__":
    test_code = "def add(a, b): return a + b"
    print(audit_code_quality("TestRepo", test_code))
