// FacultyPro - License & Modularity Engine
// Handles "Freemium" logic, Hybrid Key activation (Secure Hash), and Dynamic Theming

const License = {
    // 🔐 Configuration
    // REPLACED: Master Key removed. Using Secure Hashes.
    VALID_HASHES: [
        "dda5d319c55d78fbe7ca3bc8176eba8a51fad61e558e95c952f574016c21b30b", // ZINC-DSU-X7A9B2C
        "8d7f7dfb72016466b72d0f89c432679f6645a0347b55a47889bc0a7842903e9c", // ZINC-DSU-Y4K8M1P
        "7fa8ade9679608c5c5a3ea728df2253fd85270d8111dfe75868a82c1aaea61af", // ZINC-DSU-W3R5T9L
        "f58b5e11df716c3b4fe709f15655aab670045afd2f922a4a7303e05e9919fa09", // ZINC-DSU-Q2N6J4H
        "178e06646bc83b6160bda5a8b27f98a5f6fcb9ed7dab5c2666a61255b7a767e5"  // ZINC-DSU-V8D5F3S
    ],
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
    async init() {
        console.log("🔐 License Engine: Initializing (Async)...");
        const savedKey = localStorage.getItem(this.STORAGE_KEY);
        
        // Need to await validation since it uses crypto.subtle
        if (await this.validateKey(savedKey)) {
            console.log("🌟 Premium License Active");
            this.applyTheme(this.THEMES.PREMIUM);
            this.unlockFeatures(true);
        } else {
            console.log("🔒 Standard License Active");
            this.applyTheme(this.THEMES.DEFAULT);
            this.unlockFeatures(false);
        }
    },

    // 🔑 Secure Validation using SHA-256
    async validateKey(key) {
        if (!key) return false;
        
        try {
            const hash = await this.sha256(key.trim());
            console.log(`🔍 Checking Hash: ${hash.substring(0, 8)}...`);
            
            if (this.VALID_HASHES.includes(hash)) {
                return true;
            }
        } catch (e) {
            console.error("Hash calculation failed", e);
        }
        
        return false;
    },
    
    // Helper: SHA-256 Hashing
    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // 🔓 Activation Logic
    async activate(inputKey) {
        if (await this.validateKey(inputKey)) {
            localStorage.setItem(this.STORAGE_KEY, inputKey.trim());
            if (window.UI) UI.showToast("🌟 Premium License Activated!");
            this.applyTheme(this.THEMES.PREMIUM);
            this.unlockFeatures(true);
            
            // Reload after short delay to refresh all UI components fully
            setTimeout(() => {
                location.reload();
            }, 1000);
            return true;
        } else {
            if (window.UI) UI.showToast("❌ Invalid License Key");
            return false;
        }
    },

    // 🚫 Deactivation
    deactivate() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.applyTheme(this.THEMES.DEFAULT);
        this.unlockFeatures(false);
        if (window.UI) UI.showToast("🔒 License Deactivated");
        setTimeout(() => location.reload(), 500);
    },

    // 🎨 Theme Switcher
    applyTheme(theme) {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }
    },

    // 🛠️ Feature Toggles
    unlockFeatures(isPremium) {
        const analyticsNav = document.getElementById('nav-analytics');
        const settingsLock = document.getElementById('settings-lock-message');
        
        // License UI Elements
        const licenseInputGroup = document.getElementById('license-input-group');
        const licenseRemoveBtn = document.getElementById('license-remove-btn');
        const licenseBadge = document.getElementById('license-status-badge');
        
        // Home Logo Strategy
        const homeLogoGeneric = document.getElementById('home-logo-generic');
        const homeLogoDSU = document.getElementById('home-logo-dsu');

        if (isPremium) {
            // Unlock Analytics
            if (analyticsNav) analyticsNav.classList.remove('hidden');
            
            // Unlock Intervention Settings
            const templateBtn = document.getElementById('btn-intervention-templates');
            if (templateBtn) {
                templateBtn.disabled = false;
                templateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            
            // Update License UI -> Hide Input, Show Remove, Update Badge
            if (licenseInputGroup) licenseInputGroup.classList.add('hidden');
            if (licenseRemoveBtn) licenseRemoveBtn.classList.remove('hidden');
            if (licenseBadge) {
                licenseBadge.innerText = "PREMIUM";
                licenseBadge.className = "px-3 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)] text-xs text-[var(--primary)] font-bold tracking-wider shadow-[0_0_10px_var(--primary-dim)]";
            }
            
            // Show DSU Logo
            if (homeLogoDSU) homeLogoDSU.classList.remove('hidden');
            if (homeLogoGeneric) homeLogoGeneric.classList.add('hidden');

        } else {
            // Lock Analytics
            if (analyticsNav) analyticsNav.classList.add('hidden');
            
            // Lock Intervention Settings
            const templateBtn = document.getElementById('btn-intervention-templates');
            if (templateBtn) {
                templateBtn.disabled = true;
                templateBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            
            // Update License UI -> Show Input, Hide Remove, Reset Badge
            if (licenseInputGroup) licenseInputGroup.classList.remove('hidden');
            if (licenseRemoveBtn) licenseRemoveBtn.classList.add('hidden');
            if (licenseBadge) {
                licenseBadge.innerText = "STANDARD";
                licenseBadge.className = "px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 font-mono tracking-wider";
            }
            
            // Show Generic Profile Initial
            if (homeLogoDSU) homeLogoDSU.classList.add('hidden');
            if (homeLogoGeneric) homeLogoGeneric.classList.remove('hidden');
        }
    }
};

// Expose to window for inline HTML calls AND global access
window.License = License;
window.activateLicense = (key) => License.activate(key);
