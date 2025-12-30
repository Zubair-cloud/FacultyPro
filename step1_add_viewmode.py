import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the line with state variables (around line 620)
# Looking for: let db; let classes = []; let activeClass = null; let tempAttendance = {}; let currentStudents = [];

old_pattern = r"(let db; let classes = \[\]; let activeClass = null; let tempAttendance = \{\}; let currentStudents = \[\];)"
new_code = r"\1\n        let viewMode = 'normal'; // 'normal', 'history', 'backlog'"

# Replace
new_content = re.sub(old_pattern, new_code, content)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Added viewMode state variable after line 620")
    print("Added line: let viewMode = 'normal'; // 'normal', 'history', 'backlog'")
else:
    print("❌ FAILED: Could not find the pattern to replace")
    sys.exit(1)
