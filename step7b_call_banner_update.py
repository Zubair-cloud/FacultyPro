import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update goToHistoryView() to call updateModeBanner()
content = re.sub(
    r'(function goToHistoryView\(\) \{[\s\S]*?viewMode = \'history\';)',
    r'\1\n            updateModeBanner();',
    content,
    count=1
)

# Update goToBacklogAdd() to call updateModeBanner()
content = re.sub(
    r'(function goToBacklogAdd\(\) \{[\s\S]*?viewMode = \'backlog\';)',
    r'\1\n            updateModeBanner();',
    content,
    count=1
)

# Update openAttendance() to set viewMode and call updateModeBanner()
content = re.sub(
    r'(async function openAttendance\(cls\) \{\s+activeClass = cls;)',
    r'\1 viewMode = \'normal\'; updateModeBanner();',
    content,
    count=1
)

# Write back
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ SUCCESS: Updated navigation functions to call updateModeBanner()")
print("  - goToHistoryView() now calls updateModeBanner()")
print("  - goToBacklogAdd() now calls updateModeBanner()")
print("  - openAttendance() now sets viewMode='normal' and calls updateModeBanner()")
