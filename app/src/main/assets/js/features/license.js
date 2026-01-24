// FacultyPro - License & Modularity Engine
// Handles "Freemium" logic, Hybrid Key activation (Secure Hash), and Dynamic Theming

const License = {
    // 🔐 Configuration
    STORAGE_KEY: "facultypro_license_token", // Stores the offline token
    USER_EMAIL_KEY: "facultypro_user_email",
    
    // 🎨 Theme Definitions (Keep existing themes)
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
        },
        HOD: {
            "--primary": "#F97316",         // Orange 500
            "--primary-dim": "rgba(249, 115, 22, 0.2)",
            "--primary-dark": "#C2410C",    // Orange 700
            "--on-primary": "#FFFFFF",      // White Text
            "--bg-surface": "#0C0A09",      // Warm Black
            "--bg-glow-secondary": "rgba(124, 45, 18, 0.2)", // Rust Glow
            "--accent-text": "#FDBA74"      // Orange 300
        }
    },

    // 🚀 Initialization
    async init() {
        console.log("🔐 License Engine: Initializing...");
        
        // 1. Check Offline Token first (Fastest "Green Signal")
        const offlineToken = localStorage.getItem(this.STORAGE_KEY);
        if (offlineToken) {
            console.log("🌟 Offline Token Found. Activating Premium...");
            
            // H8 FIX: Properly detect role
            const role = this.extractRoleFromToken(offlineToken);
            localStorage.setItem('facultypro_user_role', role);
            
            this.activatePremiumUI();
            
            // Background Verify (Every 72 hours, only if online)
            if (navigator.onLine && window.FIREBASE_API) {
                this.schedulePeriodicCheck();
            }
        } else {
            console.log("🔒 No Token. Standard Mode.");
            localStorage.setItem('facultypro_user_role', 'FACULTY'); // Default
            this.applyTheme(this.THEMES.DEFAULT);
            this.unlockFeatures(false);
            this.renderLoginUI(); // Show "Login" button instead of Key Input
        }
    },
    
    // H8 FIX: Helper to extract role from token
    extractRoleFromToken(token) {
        try {
            // Token format: PREMIUM_TOKEN_${btoa(key)}_${timestamp}
            const parts = token.split('_');
            if (parts.length >= 3 && parts[0] === 'PREMIUM' && parts[1] === 'TOKEN') {
                const encodedKey = parts[2];
                const decodedKey = atob(encodedKey);
                
                // Check actual key prefix (including TEST keys)
                if (decodedKey.startsWith('ZINC-HOD-') || decodedKey.startsWith('TEST-HOD-')) {
                    return 'HOD';
                } else if (decodedKey.startsWith('ZINC-DSU-') || decodedKey.startsWith('TEST-FACULTY-')) {
                    return 'FACULTY';
                }
            }
        } catch (e) {
            console.error('Error extracting role from token:', e);
        }
        return 'FACULTY'; // Default fallback
    },

    // 🕒 Schedule Periodic Check (72 Hours)
    schedulePeriodicCheck() {
        const LAST_VERIFIED_KEY = 'facultypro_license_last_verified';
        const CHECK_INTERVAL_MS = 72 * 60 * 60 * 1000; // 72 Hours

        const lastVerified = parseInt(localStorage.getItem(LAST_VERIFIED_KEY) || '0');
        const now = Date.now();

        if (now - lastVerified > CHECK_INTERVAL_MS) {
            console.log("⏰ 72h passed. Triggering background license check...");
            this.backgroundReverify();
        } else {
             console.log("✅ Recent license check found. Skipping.");
        }
    },

    // 🔄 Background Re-verification (Safe Mode)
    async backgroundReverify() {
        if (!navigator.onLine) {
            console.log("📴 Offline. Skipping license check.");
            return;
        }

        const email = localStorage.getItem(this.USER_EMAIL_KEY);
        if (!email) return;

        try {
            console.log("☁️ Verifying License for:", email);
            const result = await window.FIREBASE_API.checkLicense(email);
            
            if (result.status === 'active') {
                console.log("✅ License Confirmed.");
                localStorage.setItem('facultypro_license_last_verified', Date.now().toString());
            } else if (result.status === 'unlicensed') {
                console.warn("⚠️ Server says Unlicensed! Revoking...");
                this.deactivate(); // Revoke if explicitly banned
            }
        } catch (e) {
            console.warn("⚠️ License check failed (Network Error). Ignoring.", e);
            // Do NOT revoke. Assume innocent until proven guilty.
        }
    },

    // 🖥️ UI: Render Login Button (replaces the old Key Input)
    renderLoginUI() {
        const container = document.getElementById('license-input-group');
        if (container) {
            container.innerHTML = `
                <button onclick="License.handleGoogleLogin()" 
                    class="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5">
                    Sign in with DSU Email
                </button>
                <p class="text-[10px] text-center text-gray-500 mt-2">Sign in to verify your faculty license.</p>
                
                <!-- TEST MODE: Quick License Buttons -->
                <div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <p class="text-[10px] text-yellow-400 font-bold mb-2">🧪 TEST MODE</p>
                    <div class="flex gap-2">
                        <button onclick="License.activateTestLicense('FACULTY')" class="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold">Faculty 1</button>
                        <button onclick="License.activateTestLicense('FACULTY')" class="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold">Faculty 2</button>
                        <button onclick="License.activateTestLicense('HOD')" class="flex-1 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-xs font-bold">HOD</button>
                    </div>
                </div>
            `;
            container.classList.remove('hidden');
        }
    },
    
    // TEST MODE: Activate test license
    activateTestLicense(role) {
        const key = role === 'HOD' ? 'TEST-HOD-001' : 'TEST-FACULTY-' + Date.now();
        console.log('🧪 Activating test license:', role);
        
        localStorage.setItem('facultypro_user_role', role);
        this.saveOfflineToken(key);
        this.activatePremiumUI();
        UI.showToast(`✅ Test ${role} License Activated`);
        
        setTimeout(() => location.reload(), 800);
    },

    // 🟢 Action: Handle Google Login
    async handleGoogleLogin() {
        if (window.UI) UI.showToast("⏳ Signing in...");
        
        if (!window.FIREBASE_API) {
            alert("Firebase not loaded! Check internet.");
            return;
        }

        // Setup Listener BEFORE calling login
        const loginListener = (e) => {
            const result = e.detail;
            if (result.success) {
                console.log("Logged in:", result.email);
                localStorage.setItem(this.USER_EMAIL_KEY, result.email);
                
                if (window.UI) UI.showToast(`Welcome, ${result.name}`);
                
                // Check License
                this.checkServerLicense(result.email);
            } else {
                alert("Login Failed: " + result.error);
            }
            // cleanup
            window.removeEventListener('firebase-login-success', loginListener);
        };
        window.addEventListener('firebase-login-success', loginListener);

        const result = await window.FIREBASE_API.loginWithGoogle();
        
        // If not pending (e.g. browser fallback), handle immediately. 
        // If pending, the listener above will handle it.
        if (!result.pending) {
            window.removeEventListener('firebase-login-success', loginListener); // remove to avoid double firing if fallback works
            if (result.success) {
                 localStorage.setItem(this.USER_EMAIL_KEY, result.email);
                 this.checkServerLicense(result.email);
            } else {
                 alert("Login Failed: " + result.error);
            }
        }
    },

    // ☁️ Check License on Server
    async checkServerLicense(email) {
        const container = document.getElementById('license-input-group');
        if(container) container.innerHTML = `<p class="text-white text-center animate-pulse">Checking License...</p>`;

        const check = await window.FIREBASE_API.checkLicense(email);

        if (check.status === 'active') {
             // Success!
             this.saveOfflineToken(check.key);
             
             // Role Detection
             if (check.key.startsWith('ZINC-HOD')) {
                 localStorage.setItem('facultypro_user_role', 'HOD');
             } else {
                 localStorage.setItem('facultypro_user_role', 'FACULTY');
             }
             
             this.activatePremiumUI();
             if (window.UI) UI.showToast("🌟 License Verified! Premium Active.");
        } else {
            // Unlicensed -> Show Key Input
            this.renderClaimUI(email);
        }
    },

    // 🖥️ UI: Key Claim Form
    renderClaimUI(email) {
        const container = document.getElementById('license-input-group');
        if (container) {
            container.innerHTML = `
                <div class="space-y-2">
                    <p class="text-xs text-gray-400">Signed in as: <span class="text-white font-bold">${email}</span></p>
                    <input id="new-license-key" type="text" placeholder="Enter License Key (e.g. ABC-123)" 
                        class="w-full rounded-xl bg-[var(--bg-surface)] border border-white/10 text-white text-sm px-4 py-3 focus:border-[var(--primary)] transition">
                    <button onclick="License.claimKey('${email}')" 
                        class="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-bold text-sm hover:opacity-90 active:scale-95 transition shadow-[0_0_15px_var(--primary-dim)]">
                        ACTIVATE LICENSE
                    </button>
                </div>
            `;
        }
    },

    // 🟢 Action: Claim Key
    async claimKey(email) {
        const keyInput = document.getElementById('new-license-key');
        const key = keyInput.value.trim();
        
        if (!key) return;

        if (window.UI) UI.showToast("⏳ Verifying Key...");
        
        // Pass basic profile info if available
        const profile = {
             name: document.getElementById('set-name')?.value || "Faculty",
             phone: document.getElementById('set-phone')?.value || ""
        };

        const result = await window.FIREBASE_API.claimLicense(email, key, profile);
        
        if (result.success) {
            this.saveOfflineToken(key);
            
            // Role Detection
            if (key.startsWith('ZINC-HOD')) {
                localStorage.setItem('facultypro_user_role', 'HOD');
            } else {
                localStorage.setItem('facultypro_user_role', 'FACULTY');
            }
            
            this.activatePremiumUI();
            if (window.UI) UI.showToast("🎉 License Claimed Successfully!");
        } else {
            if (window.UI) UI.showToast("❌ Error: " + result.error);
        }
    },

    // 💾 Save "Green Signal" Token
    saveOfflineToken(key) {
        // In real world, encrypt this. For now, we store a simple hash-like string
        const token = `PREMIUM_TOKEN_${btoa(key)}_${Date.now()}`;
        localStorage.setItem(this.STORAGE_KEY, token);
    },

    // 🔓 Unlock Premium UI
    activatePremiumUI() {
        const role = localStorage.getItem('facultypro_user_role') || 'FACULTY';
        
        if (role === 'HOD') {
            this.applyTheme(this.THEMES.HOD);
        } else {
            this.applyTheme(this.THEMES.PREMIUM);
        }
        
        this.unlockFeatures(true, role);
        
        // Hide Login UI
        const container = document.getElementById('license-input-group');
        if (container) container.classList.add('hidden');
    },

    // 🚫 Deactivation
    deactivate() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.USER_EMAIL_KEY);
        localStorage.removeItem('facultypro_user_role');
        this.applyTheme(this.THEMES.DEFAULT);
        this.unlockFeatures(false);
        this.renderLoginUI();
        if (window.UI) UI.showToast("🔒 License Removed");
        setTimeout(() => location.reload(), 500);
    },

    // 🎨 Theme Switcher (Same as before)
    applyTheme(theme) {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }
    },

    // 🛠️ Feature Toggles
    unlockFeatures(isPremium, role = 'FACULTY') {
        const analyticsNav = document.getElementById('nav-analytics');
        const licenseRemoveBtn = document.getElementById('license-remove-btn');
        const licenseBadge = document.getElementById('license-status-badge');
        const homeLogoGeneric = document.getElementById('home-logo-generic');
        const homeLogoDSU = document.getElementById('home-logo-dsu');
        
        // HOD Specifics
        const hodNav = document.getElementById('nav-hod-panel');
        const mentorSection = document.getElementById('home-mentor-section');

        if (isPremium) {
            if (analyticsNav) analyticsNav.classList.remove('hidden');
            
            // Show HOD Nav if role is HOD
            if (role === 'HOD') {
                if (hodNav) hodNav.classList.remove('hidden');
                // HOD can also be a mentor for their own class, so keep mentor section logic dynamic
            } else {
                if (hodNav) hodNav.classList.add('hidden');
            }
            
            const templateBtn = document.getElementById('btn-intervention-templates');
            if (templateBtn) {
                templateBtn.classList.remove('hidden'); // Show for premium users
            }
            if (licenseRemoveBtn) licenseRemoveBtn.classList.remove('hidden');
            if (licenseBadge) {
                licenseBadge.innerText = role === 'HOD' ? "HOD ACCESS" : "PREMIUM";
                licenseBadge.className = role === 'HOD' 
                    ? "px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500 text-xs text-orange-500 font-bold tracking-wider shadow-[0_0_10px_orange]"
                    : "px-3 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)] text-xs text-[var(--primary)] font-bold tracking-wider shadow-[0_0_10px_var(--primary-dim)]";
            }
            if (homeLogoDSU) homeLogoDSU.classList.remove('hidden');
            if (homeLogoGeneric) homeLogoGeneric.classList.add('hidden');

        } else {
            if (analyticsNav) analyticsNav.classList.add('hidden');
            if (hodNav) hodNav.classList.add('hidden');
            const templateBtn = document.getElementById('btn-intervention-templates');
            if (templateBtn) {
                templateBtn.classList.add('hidden'); // Hide for standard users
            }
            if (licenseRemoveBtn) licenseRemoveBtn.classList.add('hidden');
            if (licenseBadge) {
                licenseBadge.innerText = "STANDARD";
                licenseBadge.className = "px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 font-mono tracking-wider";
            }
            if (homeLogoDSU) homeLogoDSU.classList.add('hidden');
            if (homeLogoGeneric) homeLogoGeneric.classList.remove('hidden');
        }
    }
};

// Expose to window
window.License = License;
// Initialize somewhat early or wait for load
window.addEventListener('DOMContentLoaded', () => {
    License.init();
});
