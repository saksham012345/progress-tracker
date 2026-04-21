import requests
import json

url = "http://localhost:11434/api/generate"
data = {
    "model": "llama3",
    "prompt": "Hi",
    "stream": False
}

try:
    response = requests.post(url, json=data, timeout=30)
    print("Status Code:", response.status_code)
    if response.status_code == 200:
        print("Response:", response.json().get('response'))
    else:
        print("Error Response:", response.text)
except Exception as e:
    print("Error:", e)
