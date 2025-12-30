import re

# Read attendance.html
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract UI utility functions: showToast, openModal, closeModal, nav
# Find these functions in the JavaScript section

# Extract nav function
nav_pattern = r'(function nav\(pageId\).*?(?=function ))'
nav_match = re.search(nav_pattern, content, re.DOTALL)

# Extract modal functions
modal_pattern = r'(function openModal.*?function closeModal.*?(?=function ))'
modal_match = re.search(modal_pattern, content, re.DOTALL)

# Extract showToast  
toast_pattern = r'(function showToast\(msg\).*?(?=</script>))'
toast_match = re.search(toast_pattern, content, re.DOTALL)

# Combine all UI functions
ui_functions = []

if nav_match:
    ui_functions.append(nav_match.group(1).strip())
    print("✅ Found nav() function")
    
# Add modal and toast when found
# For now, create a basic ui.js structure

ui_js = '''// FacultyPro - UI Utilities
// Extracted from attendance.html for modular architecture

const UI = {
    // Navigation between pages
    nav(pageId) {
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
            if (typeof viewMode !== 'undefined') {
                viewMode = 'normal';
                if (typeof updateModeBanner === 'function') updateModeBanner();
            }
            bottomNav.style.transform = 'translateY(0)'; 
            attDock.style.transform = 'translateY(100%)'; 
        }
        if (pageId === 'page-settings') bottomNav.style.transform = 'translateY(100%)';
    },

    // Show toast notification
    showToast(msg) {
        const t = document.getElementById('toast');
        document.getElementById('toast-msg').innerText = msg;
        t.classList.remove('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => t.classList.add('opacity-0', 'translate-y-[-20px]'), 3000);
    },

    // Open modal
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modal.classList.add('open'), 10);
        }
    },

    // Close modal
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('open');
            setTimeout(() => {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }, 300);
        }
    }
};

// Export to global scope
window.UI = UI;

// For backward compatibility, expose functions globally
window.nav = UI.nav;
window.showToast = UI.showToast;
window.openModal = UI.openModal;
window.closeModal = UI.closeModal;

console.log('✅ UI utilities loaded');
'''

# Write to ui.js
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\js\utils\ui.js', 'w', encoding='utf-8') as f:
    f.write(ui_js)

print("✅ SUCCESS: Created js/utils/ui.js")
print("   Functions: nav, showToast, openModal, closeModal")
