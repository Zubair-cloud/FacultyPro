// FacultyPro - UI Utilities
// Extracted from attendance.html for modular architecture

const UI = {
    // Track loaded pages (home and settings are inline, already loaded)
    loadedPages: new Set(['page-home', 'page-settings', 'page-hod-students']),
    
    // Load a page dynamically via XMLHttpRequest (fetch doesn't work with file:// in WebView)
    async loadPage(pageId) {
        if (this.loadedPages.has(pageId)) return true;
        
        const pageName = pageId.replace('page-', '');
        const url = `pages/${pageName}.html`;
        
        console.log(`🔄 Loading page: ${url}`);
        
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            
            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 0) { // status 0 is OK for file://
                    const html = xhr.responseText;
                    const container = document.getElementById('page-container');
                    if (container && html) {
                        container.insertAdjacentHTML('beforeend', html);
                        this.loadedPages.add(pageId);
                        console.log(`✅ Loaded page: ${pageId}`);
                        resolve(true);
                    } else {
                        console.error(`❌ Container missing or empty HTML for ${pageId}`);
                        resolve(false);
                    }
                } else {
                    console.error(`❌ Failed to load ${pageId}: HTTP ${xhr.status}`);
                    resolve(false);
                }
            };
            
            xhr.onerror = (e) => {
                console.error(`❌ XHR error loading ${pageId}:`, e);
                resolve(false);
            };
            
            xhr.send();
        });
    },

    // Navigation between pages (now async for dynamic loading)
    async nav(pageId) {
        // Load page if not already loaded
        await this.loadPage(pageId);
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');
        
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
            if (attDock) attDock.style.transform = 'translateY(100%)'; 
        }
        // Settings page is inline, just hide nav
        if (pageId === 'page-settings') {
            bottomNav.style.transform = 'translateY(100%)';
        }
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

// For backward compatibility, expose functions globally (with proper binding)
window.nav = (pageId) => UI.nav(pageId);
window.showToast = UI.showToast;
window.openModal = UI.openModal;
window.closeModal = UI.closeModal;
window.showConfirm = (t, m) => UI.showConfirm(t, m);
window.closeConfirm = (r) => UI.closeConfirm(r);

console.log('✅ UI utilities loaded');
