
import re

with open("cert_dump.txt", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()
    
# Look for SHA1: ...
match = re.search(r"SHA1:\s*([0-9A-Fa-f:]+)", content)
if match:
    print("CLEAN_SHA1:", match.group(1).strip())
else:
    print("SHA1 not found in dump")
