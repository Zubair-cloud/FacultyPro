import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Steps 17-18 are already done! The updateModeBanner() function handles date picker visibility
# Steps 19-20: Update updateModeBanner to also control attendance dock visibility

# Find and update the updateModeBanner function to add dock control
old_banner_func = r'''function updateModeBanner\(\) \{
            const banner = document\.getElementById\('mode-banner'\);
            const icon = document\.getElementById\('mode-icon'\);
            const text = document\.getElementById\('mode-text'\);
            const navButtons = document\.getElementById\('history-nav-buttons'\);
            const dateInput = document\.getElementById\('att-date-input'\);
            
            if \(viewMode === 'history'\) \{
                banner\.classList\.remove\('hidden'\);
                banner\.className = 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-3 text-center';
                icon\.innerText = 'history_edu';
                text\.innerText = 'Viewing History \(Read-Only\)';
                navButtons\.classList\.remove\('hidden'\); // Show prev/next buttons
                dateInput\.style\.display = 'none'; // Hide date picker
            \} else if \(viewMode === 'backlog'\) \{
                banner\.classList\.remove\('hidden'\);
                banner\.className = 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-b border-orange-500/20 p-3 text-center';
                icon\.innerText = 'edit_calendar';
                text\.innerText = 'Adding Backlog Attendance';
                navButtons\.classList\.add\('hidden'\); // Hide prev/next buttons
                dateInput\.style\.display = 'block'; // Show date picker
            \} else \{
                banner\.classList\.add\('hidden'\);
                navButtons\.classList\.add\('hidden'\); // Hide prev/next buttons
                dateInput\.style\.display = 'block'; // Show date picker
            \}
        \}'''

new_banner_func = '''function updateModeBanner() {
            const banner = document.getElementById('mode-banner');
            const icon = document.getElementById('mode-icon');
            const text = document.getElementById('mode-text');
            const navButtons = document.getElementById('history-nav-buttons');
            const dateInput = document.getElementById('att-date-input');
            const attDock = document.getElementById('attendance-dock');
            
            if (viewMode === 'history') {
                banner.classList.remove('hidden');
                banner.className = 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-3 text-center';
                icon.innerText = 'history_edu';
                text.innerText = 'Viewing History (Read-Only)';
                navButtons.classList.remove('hidden'); // Show prev/next buttons
                dateInput.style.display = 'none'; // Hide date picker
                if (attDock) attDock.style.transform = 'translateY(100%)'; // Hide dock
            } else if (viewMode === 'backlog') {
                banner.classList.remove('hidden');
                banner.className = 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-b border-orange-500/20 p-3 text-center';
                icon.innerText = 'edit_calendar';
                text.innerText = 'Adding Backlog Attendance';
                navButtons.classList.add('hidden'); // Hide prev/next buttons
                dateInput.style.display = 'block'; // Show date picker
                if (attDock) attDock.style.transform = 'translateY(0)'; // Show dock
            } else {
                banner.classList.add('hidden');
                navButtons.classList.add('hidden'); // Hide prev/next buttons
                dateInput.style.display = 'block'; // Show date picker
                if (attDock) attDock.style.transform = 'translateY(0)'; // Show dock
            }
        }'''

new_content = re.sub(old_banner_func, new_banner_func, content, flags=re.MULTILINE)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Updated updateModeBanner() to control dock visibility")
    print("Steps 17-20 Complete:")
    print("  - Steps 17-18: Date picker already controlled ✅")
    print("  - Steps 19-20: Attendance dock now controlled ✅")
    print("    • History mode: Dock hidden")
    print("    • Backlog/Normal mode: Dock visible")
else:
    print("❌ FAILED: Could not find updateModeBanner function")
    sys.exit(1)
