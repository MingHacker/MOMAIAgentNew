import random
import json
from datetime import datetime, timedelta

def generate_baby_logs(days=7):
    logs = []
    now = datetime.utcnow()
    
    for day in range(days):
        base_date = now - timedelta(days=day)
        date_str = base_date.date().isoformat()

        # Feeding logs
        for _ in range(random.randint(4, 5)):
            hour = random.choice([7, 10, 13, 17, 20])
            minute = random.randint(0, 59)
            logs.append({
                "log_type": "feeding",
                "log_data": {
                    "feedTime": f"{hour:02}:{minute:02}",
                    "feedAmount": str(random.randint(150, 190))
                },
                "logged_at": f"{date_str}T{hour:02}:{minute:02}:00Z"
            })

        # Sleep logs
        for _ in range(random.randint(2, 3)):
            start_hour = random.choice([9, 12, 15])
            sleep_minutes = random.randint(60, 120)
            end_hour = (start_hour + sleep_minutes // 60) % 24
            logs.append({
                "log_type": "sleep",
                "log_data": {
                    "sleepStart": f"{start_hour:02}:00",
                    "sleepEnd": f"{end_hour:02}:{sleep_minutes % 60:02}"
                },
                "logged_at": f"{date_str}T{start_hour:02}:00:00Z"
            })

        # Diaper logs
        for _ in range(random.randint(5, 7)):
            hour = random.randint(7, 22)
            minute = random.randint(0, 59)
            logs.append({
                "log_type": "diaper",
                "log_data": {
                    "diaperTime": f"{hour:02}:{minute:02}",
                    "diaperSolid": random.choice([True, False])
                },
                "logged_at": f"{date_str}T{hour:02}:{minute:02}:00Z"
            })

        # Outside log (optional 50%概率出门)
        if random.random() > 0.3:
            hour = random.randint(10, 17)
            minute = random.randint(0, 59)
            logs.append({
                "log_type": "outside",
                "log_data": {
                    "outsideDuration": str(random.randint(20, 60))
                },
                "logged_at": f"{date_str}T{hour:02}:{minute:02}:00Z"
            })
    
    # 按 logged_at 时间排序
    logs.sort(key=lambda x: x["logged_at"])
    return logs

def save_baby_logs_to_file(days=7, filename="baby_logs_4_month_last_7_days.json"):
    logs = generate_baby_logs(days=days)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)
    print(f"✅ Saved {len(logs)} logs to {filename}")

# 调用
save_baby_logs_to_file(days=7, filename="baby_logs_4_month_last_7_days.json")
