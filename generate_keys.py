import random
import string
import json

def generate_key():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))
    return f"ZINC-DSU-{suffix}"

keys = [generate_key() for _ in range(100)]

# Save as JSON for the upload script to use later
with open("license_keys.json", "w") as f:
    json.dump(keys, f, indent=2)

# Save as Text for the Report
with open("license_keys_list.txt", "w") as f:
    for i, key in enumerate(keys, 1):
        f.write(f"{i}. {key}\n")

print(f"Generated {len(keys)} keys.")
