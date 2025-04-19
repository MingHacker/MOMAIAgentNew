import json

def format_baby_logs(baby_logs):
    return json.dumps(baby_logs, indent=2, ensure_ascii=False)
