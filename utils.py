def sec_to_timestamp(sec: float) -> str:
    sec = int(sec)
    h = sec // 60 ** 2
    m = sec % 60 ** 2 // 60
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:02d}"
