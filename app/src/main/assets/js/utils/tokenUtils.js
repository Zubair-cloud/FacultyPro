// FacultyPro - Magic Token Utilities
// Handles Base64 encoding/decoding for attendance sharing

const TokenUtils = {
    // Token prefixes for identification
    PREFIXES: {
        FACULTY_ATTENDANCE: 'FPROATT_',      // Single subject attendance
        STUDENT_FORMAT: 'FPROSTU_'           // Student roster format
    },

    // Encode data to magic token
    encode(data, type) {
        try {
            const prefix = this.PREFIXES[type] || 'FPRO_';
            const payload = {
                ...data,
                version: '1.0',
                type: type,
                timestamp: Date.now()
            };
            const json = JSON.stringify(payload);
            // Handle Unicode properly
            const base64 = btoa(unescape(encodeURIComponent(json)));
            return prefix + base64;
        } catch (e) {
            console.error('Token encode failed:', e);
            return null;
        }
    },

    // Decode magic token
    decode(token) {
        try {
            if (!token || typeof token !== 'string') {
                throw new Error('Token must be a non-empty string');
            }

            // Detect type from prefix
            let type = null;
            let base64Data = token.trim();
            
            for (const [key, prefix] of Object.entries(this.PREFIXES)) {
                if (base64Data.startsWith(prefix)) {
                    type = key;
                    base64Data = base64Data.slice(prefix.length);
                    break;
                }
            }
            
            if (!type) {
                throw new Error('Unknown token format - missing FPRO prefix');
            }
            
            // Decode Base64 with Unicode support
            const json = decodeURIComponent(escape(atob(base64Data)));
            const payload = JSON.parse(json);
            
            // Validate required fields
            if (!payload.version || !payload.type) {
                throw new Error('Invalid token structure - missing version or type');
            }
            
            return { success: true, type, payload };
        } catch (e) {
            console.error('Token decode failed:', e);
            return { success: false, error: e.message };
        }
    },

    // Copy to clipboard (with Android fallback)
    async copyToClipboard(text) {
        try {
            // Try Android native method first
            if (typeof Android !== 'undefined' && Android.copyToClipboard) {
                Android.copyToClipboard(text);
                return true;
            }
            // Fallback to browser API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            // Last resort: execCommand (deprecated but widely supported)
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        } catch (e) {
            console.error('Clipboard copy failed:', e);
            return false;
        }
    },

    // Read from clipboard
    async readFromClipboard() {
        try {
            // Try Android native method first
            if (typeof Android !== 'undefined' && Android.readClipboard) {
                return Android.readClipboard();
            }
            // Fallback to browser API
            if (navigator.clipboard && navigator.clipboard.readText) {
                return await navigator.clipboard.readText();
            }
            return null;
        } catch (e) {
            console.error('Clipboard read failed:', e);
            return null;
        }
    },

    // Validate token without fully decoding
    isValidToken(token) {
        if (!token || typeof token !== 'string') return false;
        const trimmed = token.trim();
        return Object.values(this.PREFIXES).some(prefix => trimmed.startsWith(prefix));
    },

    // Get token type from prefix
    getTokenType(token) {
        if (!token) return null;
        const trimmed = token.trim();
        for (const [type, prefix] of Object.entries(this.PREFIXES)) {
            if (trimmed.startsWith(prefix)) return type;
        }
        return null;
    }
};

// Export to global scope
window.TokenUtils = TokenUtils;
console.log('✅ TokenUtils module loaded');
