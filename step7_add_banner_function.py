import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the updateModeBanner function after the goToBacklogAdd function (around line 953)
# This function will show/hide and update the banner based on viewMode

banner_function = '''
        function updateModeBanner() {
            const banner = document.getElementById('mode-banner');
            const icon = document.getElementById('mode-icon');
            const text = document.getElementById('mode-text');
            
            if (viewMode === 'history') {
                banner.classList.remove('hidden');
                banner.className = 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-3 text-center';
                icon.innerText = 'history_edu';
                text.innerText = 'Viewing History (Read-Only)';
            } else if (viewMode === 'backlog') {
                banner.classList.remove('hidden');
                banner.className = 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-b border-orange-500/20 p-3 text-center';
                icon.innerText = 'edit_calendar';
                text.innerText = 'Adding Backlog Attendance';
            } else {
                banner.classList.add('hidden');
            }
        }
'''

# Find where to insert (after goToBacklogAdd function)
pattern = r'(function goToBacklogAdd\(\) \{[\s\S]*?\n        \})'
replacement = r'\1' + banner_function

new_content = re.sub(pattern, replacement, content, count=1)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Added updateModeBanner() function")
    print("Function will:")
    print("  - Show blue banner with 'Viewing History' in history mode")
    print("  - Show orange banner with 'Adding Backlog' in backlog mode")
    print("  - Hide banner in normal mode")
else:
    print("❌ FAILED: Could not find goToBacklogAdd function")
    sys.exit(1)
