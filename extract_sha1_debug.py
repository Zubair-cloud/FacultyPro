
import re

print("Reading file...")
with open("cert_dump.txt", "r", encoding="utf-16", errors="ignore") as f:
    content = f.read()

print("File len:", len(content))

# Debug: print context around "SHA1"
idx = content.find("SHA1")
if idx != -1:
    print("Found SHA1 at index:", idx)
    print("Context:", content[idx:idx+100])
    
    # Extract hex
    # Look for sequence of hex bytes separated by colons
    match = re.search(r"((?:[0-9A-F]{2}:){19}[0-9A-F]{2})", content[idx:], re.IGNORECASE)
    if match:
        print("CLEAN_SHA1:", match.group(1))
    else:
        print("Regex failed to match full SHA1")
else:
    print("SHA1 literal not found in text")
