import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 8: Add Previous/Next day navigation buttons
# These buttons should appear in place of the date input when in history mode

nav_buttons_html = '''            <!-- Previous/Next Day Navigation (for History Mode) -->
            <div id="history-nav-buttons" class="hidden bg-white/5 border-b border-white/5 p-2 flex items-center justify-center gap-3">
                <button onclick="navigatePrevDay()" class="flex items-center gap-1 px-3 py-2 rounded-lg glass-card text-white hover:bg-white/10 transition">
                    <span class="material-symbols-outlined text-lg">chevron_left</span>
                    <span class="text-sm font-medium">Previous Day</span>
                </button>
                <button onclick="navigateNextDay()" class="flex items-center gap-1 px-3 py-2 rounded-lg glass-card text-white hover:bg-white/10 transition">
                    <span class="text-sm font-medium">Next Day</span>
                    <span class="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>
'''

# Insert before the mode-banner div
pattern = r'(\s+\u003c!-- Mode Indicator Banner --\u003e)'
replacement = nav_buttons_html + r'\1'

new_content = re.sub(pattern, replacement, content, count=1)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Added Previous/Next navigation buttons HTML")
    print("Buttons will be visible in history mode only")
else:
    print("❌ FAILED: Could not find insertion point")
    sys.exit(1)
