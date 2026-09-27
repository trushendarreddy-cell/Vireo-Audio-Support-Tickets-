import requests, json, sys
url = 'http://127.0.0.1:8000/api/ai/chat'
payload = {"message": "hi", "history": []}
try:
    resp = requests.post(url, json=payload, timeout=10)
    print('status', resp.status_code)
    print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print('error', e)
    sys.exit(1)
