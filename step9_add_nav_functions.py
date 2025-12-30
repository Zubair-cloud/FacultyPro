import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 9: Add navigatePrevDay and navigateNextDay functions
nav_functions = '''
        function navigatePrevDay() {
            const currentDate = new Date(currentAttendanceDate);
            currentDate.setDate(currentDate.getDate() - 1);
            const newDate = currentDate.toLocaleDateString('en-CA');
            currentAttendanceDate = newDate;
            document.getElementById('att-date-display').innerText = currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            loadAttendanceForDate(newDate);
        }

        function navigateNextDay() {
            const currentDate = new Date(currentAttendanceDate);
            currentDate.setDate(currentDate.getDate() + 1);
            const newDate = currentDate.toLocaleDateString('en-CA');
            currentAttendanceDate = newDate;
            document.getElementById('att-date-display').innerText = currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            loadAttendanceForDate(newDate);
        }
'''

# Insert after updateModeBanner function
pattern = r'(function updateModeBanner\(\) \{[\s\S]*?\n        \})'
replacement = r'\1' + nav_functions

new_content = re.sub(pattern, replacement, content, count=1)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Added navigatePrevDay() and navigateNextDay() functions")
    print("Functions will:")
    print("  - Navigate to previous/next day's attendance")
    print("  - Update date display")
    print("  - Reload attendance data for new date")
else:
    print("❌ FAILED: Could not find updateModeBanner function")
    sys.exit(1)
