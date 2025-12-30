import re

# Read the original attendance.html
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract Tailwind config (lines 19-41 approximately)
tailwind_pattern = r'<script id="tailwind-config">(.*?)</script>'
tailwind_match = re.search(tailwind_pattern, content, re.DOTALL)

if tailwind_match:
    js_content = tailwind_match.group(1).strip()
    
    # Write to tailwind.config.js
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\css\tailwind.config.js', 'w', encoding='utf-8') as f:
        f.write("""// FacultyPro - Tailwind CSS Configuration
// Extracted from attendance.html for modular architecture

""")
        f.write(js_content)
    
    print("✅ SUCCESS: Extracted Tailwind config to tailwind.config.js")
    print(f"   Size: {len(js_content)} characters")
else:
    print("❌ FAILED: Could not find Tailwind config")
