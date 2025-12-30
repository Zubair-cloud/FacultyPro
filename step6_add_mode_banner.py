import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the late-entry-timer div (line 213) and add the mode banner before it
# The banner should be visible when in history or backlog mode

banner_html = '''            <!-- Mode Indicator Banner -->
            <div id="mode-banner" class="hidden bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-3 text-center">
                <p class="text-white text-sm font-bold flex items-center justify-center gap-2">
                    <span id="mode-icon" class="material-symbols-outlined text-lg"></span>
                    <span id="mode-text"></span>
                </p>
            </div>
'''

# Insert before the late-entry-timer div
pattern = r'(\s+<div id="late-entry-timer")'
replacement = banner_html + r'\1'

new_content = re.sub(pattern, replacement, content, count=1)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Added mode indicator banner HTML")
    print("Banner will show:")
    print("  - 📖 'Viewing History (Read-Only)' in history mode")
    print("  - 📝 'Adding Backlog Attendance' in backlog mode")
    print("  - Hidden in normal mode")
else:
    print("❌ FAILED: Could not find insertion point")
    sys.exit(1)
