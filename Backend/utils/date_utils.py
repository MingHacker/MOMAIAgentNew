from datetime import datetime
from dateutil.parser import parse as parse_date

def safe_parse_datetime(text: str) -> str:
    try:
        return parse_date(text).isoformat()
    except:
        return datetime.utcnow().isoformat() 