// FacultyPro - License & Modularity Engine
// Handles "Freemium" logic, Master Key activation, and Dynamic Theming

const License = {
    // 🔐 Configuration
    MASTER_KEY: "ZINC-MASTER-DSU",
    STORAGE_KEY: "facultypro_license",
    
    // 🎨 Theme Definitions
    THEMES: {
        DEFAULT: {
            "--primary": "#3B82F6",         // Blue 500
            "--primary-dim": "rgba(59, 130, 246, 0.1)",
            "--primary-dark": "#1d4ed8",    // Blue 700
            "--on-primary": "#FFFFFF",      // White Text
            "--bg-surface": "#020617",      // Deep Slate Black
            "--bg-glow-secondary": "rgba(100, 116, 139, 0.08)", // Subtle Slate
            "--accent-text": "#9CA3AF"      // Gray 400
        },
        PREMIUM: {
            "--primary": "#DEBE63",         // DSU Gold
            "--primary-dim": "rgba(222, 190, 99, 0.2)",
            "--primary-dark": "#A47F1E",    // Deep Gold
            "--on-primary": "#000000",      // Black Text
            "--bg-surface": "#101010",      // Deep Black
            "--bg-glow-secondary": "rgba(93, 37, 13, 0.3)", // Maroon Glow
            "--accent-text": "#DEBE63"      // Gold
        }
    },

    // 🚀 Initialization
    init() {
        console.log("🔐 License Engine: Initializing...");
        const savedKey = localStorage.getItem(this.STORAGE_KEY);
        
        if (this.validateKey(savedKey)) {
            console.log("🌟 Premium License Active");
            this.applyTheme(this.THEMES.PREMIUM);
            this.unlockFeatures(true);
        } else {
            console.log("🔒 Standard License Active");
            this.applyTheme(this.THEMES.DEFAULT);
            this.unlockFeatures(false);
        }
    },

    // 🔑 Validation
    validateKey(key) {
        if (!key) return false;
        // Simple Master Key check for now
        return key.trim() === this.MASTER_KEY;
    },

    // ⚡ Activation
    activate(key) {
        if (this.validateKey(key)) {
            localStorage.setItem(this.STORAGE_KEY, key);
            if (window.UI) UI.showToast("🌟 Premium Activated!");
            setTimeout(() => location.reload(), 1000); // Reload to apply all changes cleanly
            return true;
        } else {
            if (window.UI) UI.showToast("❌ Invalid License Key");
            return false;
        }
    },

    // 🚮 Deactivation (For testing)
    deactivate() {
        localStorage.removeItem(this.STORAGE_KEY);
        if (window.UI) UI.showToast("🔒 License Removed");
        setTimeout(() => location.reload(), 1000);
    },

    // 🎨 Theme Application
    applyTheme(theme) {
        const root = document.documentElement;
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    },

    // 🔓 Feature Locking/Unlocking
    unlockFeatures(isPremium) {
        // We will control visibility via CSS classes toggled here
        const analyticsNav = document.getElementById('nav-analytics');
        const analyticsPage = document.getElementById('page-analytics');
        const templateBtn = document.getElementById('btn-intervention-templates');
        
        // Home Header Logos
        const logoDSU = document.getElementById('home-logo-dsu');
        const logoGeneric = document.getElementById('home-logo-generic');
        
        // Settings UI Elements
        const statusBadge = document.getElementById('license-status-badge');
        const inputGroup = document.getElementById('license-input-group');
        const removeBtn = document.getElementById('license-remove-btn');
        
        if (isPremium) {
            // Unlock
            if (analyticsNav) analyticsNav.classList.remove('hidden');
            if (templateBtn) templateBtn.classList.remove('hidden');
            
            // Toggle Logos (Show DSU)
            if (logoDSU) logoDSU.classList.remove('hidden');
            if (logoGeneric) logoGeneric.classList.add('hidden');
            
            // UI Updates
            if (statusBadge) {
                statusBadge.innerText = "PREMIUM (GOLD)";
                statusBadge.className = "px-3 py-1 rounded-lg bg-[#DEBE63]/20 border border-[#DEBE63] text-[#DEBE63] text-xs font-bold font-mono tracking-wider shadow-[0_0_10px_rgba(222,190,99,0.3)]";
            }
            if (inputGroup) inputGroup.classList.add('hidden');
            if (removeBtn) removeBtn.classList.remove('hidden');
            
        } else {
            // Lock
            if (analyticsNav) analyticsNav.classList.add('hidden');
            if (templateBtn) templateBtn.classList.add('hidden');
            
            // Toggle Logos (Show Generic)
            if (logoDSU) logoDSU.classList.add('hidden');
            if (logoGeneric) logoGeneric.classList.remove('hidden');
            
            // UI Updates
            if (statusBadge) {
                statusBadge.innerText = "STANDARD";
                statusBadge.className = "px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 font-mono tracking-wider";
            }
            if (inputGroup) inputGroup.classList.remove('hidden');
            if (removeBtn) removeBtn.classList.add('hidden');
            
            // Check if user is currently on a locked page (Analytics)
            if (analyticsPage && analyticsPage.classList.contains('active')) {
                UI.nav('page-home'); // Kick to home
            }
        }
    },
    
    // ❓ Helper for other modules
    isPremium() {
        return this.validateKey(localStorage.getItem(this.STORAGE_KEY));
    }
};

// Export Globallly
window.License = License;
window.activateLicense = (key) => License.activate(key);
