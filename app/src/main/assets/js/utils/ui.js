// FacultyPro - UI Utilities
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
    },

    // Confirmation Dialog
    showConfirm(title, message) {
        return new Promise(resolve => {
            this.confirmResolve = resolve;
            document.getElementById('confirm-title').innerText = title;
            document.getElementById('confirm-message').innerText = message;
            this.openModal('modal-confirm');
        });
    },

    closeConfirm(result) {
        this.closeModal('modal-confirm');
        if (this.confirmResolve) {
            this.confirmResolve(result);
            this.confirmResolve = null;
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
window.showConfirm = (t, m) => UI.showConfirm(t, m);
window.closeConfirm = (r) => UI.closeConfirm(r);

console.log('✅ UI utilities loaded');
