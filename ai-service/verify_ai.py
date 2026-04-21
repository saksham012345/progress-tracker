import requests
import json

url = "http://127.0.0.1:8000/rag/decompose"
data = {
    "task": "Learn Python basics",
    "context": "Beginner"
}

try:
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
