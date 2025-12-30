import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Steps 21-22: Reset viewMode when leaving attendance page
# Update the nav() function to reset viewMode when navigating away from attendance

old_nav = r'''function nav\(pageId\) \{
            document\.querySelectorAll\('\.page'\)\.forEach\(p => p\.classList\.remove\('active'\)\);
            document\.getElementById\(pageId\)\.classList\.add\('active'\);
            document\.querySelectorAll\('\.nav-item'\)\.forEach\(item => item\.classList\.remove\('active'\)\);
            const navId = 'nav-' \+ pageId\.replace\('page-', ''\);
            const navEl = document\.getElementById\(navId\);
            if \(navEl\) navEl\.classList\.add\('active'\);

            if \(pageId === 'page-manage'\) loadManageClasses\(\);
            if \(pageId === 'page-export'\) loadExportClasses\(\);

            const bottomNav = document\.getElementById\('bottom-nav'\);
            const attDock = document\.getElementById\('attendance-dock'\);
            if \(pageId === 'page-attendance'\) \{ bottomNav\.style\.transform = 'translateY\(100%\)'; attDock\.style\.transform = 'translateY\(0\)'; \}
            else \{ bottomNav\.style\.transform = 'translateY\(0\)'; attDock\.style\.transform = 'translateY\(100%\)'; \}
            if \(pageId === 'page-settings'\) bottomNav\.style\.transform = 'translateY\(100%\)';
        \}'''

new_nav = '''function nav(pageId) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            const navId = 'nav-' + pageId.replace('page-', '');
            const navEl = document.getElementById(navId);
            if (navEl) navEl.classList.add('active');

            if (pageId === 'page-manage') loadManageClasses();
            if (pageId === 'page-export') loadExportClasses();

            const bottomNav = document.getElementById('bottom-nav');
            const attDock = document.getElementById('attendance-dock');
            if (pageId === 'page-attendance') { 
                bottomNav.style.transform = 'translateY(100%)'; 
                // Don't set attDock here - let updateModeBanner() handle it
            }
            else { 
                // Reset viewMode when leaving attendance page
                viewMode = 'normal';
                updateModeBanner();
                bottomNav.style.transform = 'translateY(0)'; 
                attDock.style.transform = 'translateY(100%)'; 
            }
            if (pageId === 'page-settings') bottomNav.style.transform = 'translateY(100%)';
        }'''

new_content = re.sub(old_nav, new_nav, content, flags=re.MULTILINE)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Updated nav() function")
    print("Steps 21-22 Complete:")
    print("  - viewMode resets to 'normal' when leaving attendance page")
    print("  - updateModeBanner() called to hide banner")
    print("  - Ensures clean state when returning to attendance")
else:
    print("❌ FAILED: Could not find nav function")
    sys.exit(1)
