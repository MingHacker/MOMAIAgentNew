from datetime import date, datetime, timedelta
from typing import List, Dict, Optional


def is_baby_milestone_tomorrow(birthday: str) -> Optional[int]:
    tomorrow = date.today() + timedelta(days=1)
    birth = datetime.fromisoformat(birthday).date()
    months = (tomorrow.year - birth.year) * 12 + tomorrow.month - birth.month
    if tomorrow.day == birth.day:
        return months
    return None


def count_consecutive_low_sleep(data: List[Dict]) -> int:
    count = 0
    for day in reversed(data):  # 从最近一天向前
        if day.get("sleep_hours", 0) < 5.5 or day.get("hrv", 0) < 40:
            count += 1
        else:
            break
    return count

from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import List, Dict, Optional


def is_baby_milestone_tomorrow(birthday: str) -> Optional[int]:
    """判断明天是否是宝宝满月日，返回几个月大"""
    tomorrow = date.today() + timedelta(days=1)
    birth = datetime.fromisoformat(birthday).date()
    months = (tomorrow.year - birth.year) * 12 + tomorrow.month - birth.month
    if tomorrow.day == birth.day:
        return months
    return None


def count_consecutive_low_sleep(data: List[Dict]) -> int:
    """判断 mom 是否连续多天低睡眠或低 HRV"""
    count = 0
    for day in reversed(data):  # 从最近向前数
        if day.get("sleep_hours", 0) < 5.5 or day.get("hrv", 0) < 40:
            count += 1
        else:
            break
    return count


def is_mom_birthday_today(birthday: str) -> bool:
    """判断今天是否是妈妈生日"""
    today = date.today()
    birth = datetime.fromisoformat(birthday).date()
    return today.month == birth.month and today.day == birth.day


def days_since_baby_birth(birthday: str) -> int:
    """计算宝宝出生天数"""
    today = date.today()
    birth = datetime.fromisoformat(birthday).date()
    return (today - birth).days


def get_baby_months_old(birthday: str) -> int:
    """获取宝宝当前月龄"""
    birth = datetime.fromisoformat(birthday).date()
    today = date.today()
    delta = relativedelta(today, birth)
    return delta.years * 12 + delta.months
