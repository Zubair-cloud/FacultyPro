
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import fs from 'fs';

// 1. Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAHz7LfTVqosXdVR0K8VM6dSDpZy-m2kMc",
    authDomain: "facultypro-licensing.firebaseapp.com",
    projectId: "facultypro-licensing",
    storageBucket: "facultypro-licensing.firebasestorage.app",
    messagingSenderId: "241911004176",
    appId: "1:241911004176:web:19dd5266456e773a585e95"
};

// 2. Initialize
console.log("🔥 Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Load Keys
const keysRaw = fs.readFileSync('license_keys.json', 'utf8');
const keys = JSON.parse(keysRaw);
console.log(`📂 Loaded ${keys.length} keys to upload.`);

// 4. Upload Function
async function uploadKeys() {
    const batchSize = 400; // Firestore batch limit is 500
    let batch = writeBatch(db);
    let count = 0;
    let total = 0;

    console.log("🚀 Starting Upload...");

    for (const key of keys) {
        const ref = doc(db, "licenses", key);
        
        // Data: Key, unused, standard type (default)
        // Note: For legacy keys, we might want to tag them, but for now treating all same
        batch.set(ref, {
            key: key,
            isUsed: false,
            assignedTo: null,
            createdAt: new Date().toISOString()
        });

        count++;
        total++;

        // Commit batch if full
        if (count >= batchSize) {
            await batch.commit();
            console.log(`✅ Committed batch of ${count} keys.`);
            batch = writeBatch(db); // Reset
            count = 0;
        }
    }

    // Commit remaining
    if (count > 0) {
        await batch.commit();
        console.log(`✅ Committed final batch of ${count} keys.`);
    }

    console.log(`🎉 SUCCESS: Uploaded ${total} keys to Firestore!`);
    process.exit(0);
}

uploadKeys().catch(console.error);
