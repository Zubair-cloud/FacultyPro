import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHz7LfTVqosXdVR0K8VM6dSDpZy-m2kMc",
    authDomain: "facultypro-licensing.firebaseapp.com",
    projectId: "facultypro-licensing",
    storageBucket: "facultypro-licensing.firebasestorage.app",
    messagingSenderId: "241911004176",
    appId: "1:241911004176:web:19dd5266456e773a585e95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Expose to Global Window for other scripts to use
window.FIREBASE_API = {
    isInitialized: true,
    
    // Login with Google (Native Only Enforced)
    loginWithGoogle: async () => {
        // Debugging Bridge Presence
        console.log("Checking for Native Bridge...");
        
        if (window.Android && window.Android.nativeGoogleLogin) {
            console.log("📲 Calling Native Android Login...");
            window.Android.nativeGoogleLogin();
            return { pending: true };
        } else {
            // CRITICAL ERROR: Bridge not found
            const status = window.Android ? "Android Found, Method Missing" : "Window.Android is UNDEFINED";
            alert("CRITICAL: Native Bridge Missing! " + status);
            return { success: false, error: "Native Bridge Missing: " + status };
        }
    },

    // Callback called by Java Native Code
    handleNativeLoginSuccess: async (idToken, email, name) => {
        try {
            console.log("📲 Received Native Identity:", email);
            
            // 1. Sign in Anonymously to Firebase (Allowed on file://)
            // This satisfies request.auth != null rules in Firestore
            await signInAnonymously(auth);
            console.log("✅ Firebase Anonymous Auth Success");

            // 2. Dispatch the REAL user identity (from Native Google)
            const event = new CustomEvent('firebase-login-success', { 
                detail: {
                    success: true,
                    email: email, 
                    name: name || "User",
                    uid: auth.currentUser.uid // Use Anon UID for Firestore access, but Logic uses Email
                }
            });
            window.dispatchEvent(event);

        } catch (error) {
            console.error("Native Auth Error:", error);
            const event = new CustomEvent('firebase-login-success', { 
                detail: { success: false, error: error.message }
            });
            window.dispatchEvent(event);
        }
    },

    // Check License Status (The "Green Signal" Check)
    checkLicense: async (email) => {
        if (!email) return { status: 'error', message: 'No email provided' };
        
        try {
            // Check 'users' collection for this email
            const userRef = doc(db, "users", email);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                if (data.licenseKey) {
                    return { status: 'active', licenseType: data.licenseType || 'standard', key: data.licenseKey };
                }
            }
            return { status: 'unlicensed' };
        } catch (e) {
            console.error("License Check Error:", e);
            // If offline or error, we might interpret as 'offline' but here we return error
            return { status: 'error', message: e.message };
        }
    },

    // Claim a New License Key
    claimLicense: async (email, key, profileData) => {
        try {
            const keyHash = key; // ideally hash this, but for now use raw key as ID or field
            // Note: In real app, Document ID for license should be Hashed(Key) for security.
            // For this Spark Plan demo, let's assume 'licenses' collection has docId = key.

            const licenseRef = doc(db, "licenses", key);
            const userRef = doc(db, "users", email);

            // Run Transaction
            await runTransaction(db, async (transaction) => {
                const licenseDoc = await transaction.get(licenseRef);
                if (!licenseDoc.exists()) {
                    throw "Invalid License Key!";
                }

                const licData = licenseDoc.data();
                if (licData.isUsed) {
                    throw "License Key already used!";
                }

                // Update License
                transaction.update(licenseRef, {
                    isUsed: true,
                    assignedTo: email,
                    assignedAt: new Date().toISOString()
                });

                // Create/Update User
                transaction.set(userRef, {
                    email: email,
                    licenseKey: key,
                    licenseType: licData.type || 'dsu_premium',
                    profile: profileData || {}
                });
            });

            return { success: true };

        } catch (e) {
            console.error("Claim Error:", e);
            return { success: false, error: typeof e === 'string' ? e : e.message };
        }
    },

    // Sign Out
    logout: async () => {
        await signOut(auth);
    }
};

console.log("🔥 Firebase Modular SDK Initialized & Attached to Window");
