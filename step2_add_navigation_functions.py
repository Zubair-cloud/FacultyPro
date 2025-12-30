import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the goToHistory function (around line 902) to add new functions after it
# We'll add two new functions: goToHistoryView() and goToBacklogAdd()

old_pattern = r"(function goToHistory\(mode\) \{[\s\S]*?\n        \})"

# The new functions to add after goToHistory
new_functions = r'''\1

        function goToHistoryView() {
            const clsId = parseInt(document.getElementById('hist-class-select').value);
            const date = document.getElementById('hist-date-input').value;
            if (!clsId) return showToast("Select a Class");
            if (!date) return showToast("Select a Date");

            const cls = classes.find(c => c.id === clsId);
            activeClass = cls;
            viewMode = 'history'; // Set to read-only history mode
            nav('page-attendance');
            document.getElementById('att-title').innerText = cls.name;
            const dateObj = new Date(date);
            document.getElementById('att-date-display').innerText = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            currentAttendanceDate = date;
            loadAttendanceForDate(date);
        }

        function goToBacklogAdd() {
            const clsId = parseInt(document.getElementById('backlog-class-select').value);
            const date = document.getElementById('backlog-date-input').value;
            if (!clsId) return showToast("Select a Class");
            if (!date) return showToast("Select a Date");

            const cls = classes.find(c => c.id === clsId);
            activeClass = cls;
            viewMode = 'backlog'; // Set to backlog entry mode
            nav('page-attendance');
            document.getElementById('att-title').innerText = cls.name;
            const dateObj = new Date(date);
            document.getElementById('att-date-display').innerText = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            currentAttendanceDate = date;
            loadAttendanceForDate(date);
        }'''

# Replace
new_content = re.sub(old_pattern, new_functions, content, flags=re.MULTILINE)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Added goToHistoryView() and goToBacklogAdd() functions")
    print("These functions set viewMode appropriately:")
    print("  - goToHistoryView() sets viewMode = 'history' (read-only)")
    print("  - goToBacklogAdd() sets viewMode = 'backlog' (editable)")
else:
    print("❌ FAILED: Could not find the goToHistory function to insert after")
    sys.exit(1)
