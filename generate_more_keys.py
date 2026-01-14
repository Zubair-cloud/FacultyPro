import random
import string
import json

# Legacy Keys (From previous comments)
legacy_keys = [
    "ZINC-DSU-X7A9B2C",
    "ZINC-DSU-Y4K8M1P",
    "ZINC-DSU-W3R5T9L",
    "ZINC-DSU-Q2N6J4H",
    "ZINC-DSU-V8D5F3S"
]

def generate_key():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))
    return f"ZINC-DSU-{suffix}"

# Load existing 100 keys (if file exists) or start fresh
try:
    with open("license_keys.json", "r") as f:
        existing_keys = json.load(f)
except FileNotFoundError:
    existing_keys = [generate_key() for _ in range(100)]

# Generate 20 MORE keys
new_keys = [generate_key() for _ in range(20)]

# Combine All
final_keys = legacy_keys + existing_keys + new_keys

# Remove duplicates just in case
final_keys = list(set(final_keys))

# Save
with open("license_keys.json", "w") as f:
    json.dump(final_keys, f, indent=2)

print(f"Total Keys: {len(final_keys)}")
print("Added 5 Legacy Keys + 20 New Keys.")
