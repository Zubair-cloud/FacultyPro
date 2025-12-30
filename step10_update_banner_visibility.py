import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 10: Update updateModeBanner function to show/hide nav buttons and date picker
# Find the updateModeBanner function and modify it

old_function = r'''function updateModeBanner\(\) \{
            const banner = document\.getElementById\('mode-banner'\);
            const icon = document\.getElementById\('mode-icon'\);
            const text = document\.getElementById\('mode-text'\);
            
            if \(viewMode === 'history'\) \{
                banner\.classList\.remove\('hidden'\);
                banner\.className = 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-3 text-center';
                icon\.innerText = 'history_edu';
                text\.innerText = 'Viewing History \(Read-Only\)';
            \} else if \(viewMode === 'backlog'\) \{
                banner\.classList\.remove\('hidden'\);
                banner\.className = 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-b border-orange-500/20 p-3 text-center';
                icon\.innerText = 'edit_calendar';
                text\.innerText = 'Adding Backlog Attendance';
            \} else \{
                banner\.classList\.add\('hidden'\);
            \}
        \}'''

new_function = '''function updateModeBanner() {
            const banner = document.getElementById('mode-banner');
            const icon = document.getElementById('mode-icon');
            const text = document.getElementById('mode-text');
            const navButtons = document.getElementById('history-nav-buttons');
            const dateInput = document.getElementById('att-date-input');
            
            if (viewMode === 'history') {
                banner.classList.remove('hidden');
                banner.className = 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-3 text-center';
                icon.innerText = 'history_edu';
                text.innerText = 'Viewing History (Read-Only)';
                navButtons.classList.remove('hidden'); // Show prev/next buttons
                dateInput.style.display = 'none'; // Hide date picker
            } else if (viewMode === 'backlog') {
                banner.classList.remove('hidden');
                banner.className = 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-b border-orange-500/20 p-3 text-center';
                icon.innerText = 'edit_calendar';
                text.innerText = 'Adding Backlog Attendance';
                navButtons.classList.add('hidden'); // Hide prev/next buttons
                dateInput.style.display = 'block'; // Show date picker
            } else {
                banner.classList.add('hidden');
                navButtons.classList.add('hidden'); // Hide prev/next buttons
                dateInput.style.display = 'block'; // Show date picker
            }
        }'''

new_content = re.sub(old_function, new_function, content, flags=re.MULTILINE)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Updated updateModeBanner() to control navigation visibility")
    print("Logic:")
    print("  - History mode: Show prev/next buttons, hide date picker")
    print("  - Backlog mode: Hide prev/next buttons, show date picker")
    print("  - Normal mode: Hide prev/next buttons, show date picker")
else:
    print("❌ FAILED: Could not find updateModeBanner function to modify")
    sys.exit(1)
