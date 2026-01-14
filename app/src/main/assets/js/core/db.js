// FacultyPro - Database Layer (IndexedDB)
// Extracted from attendance.html for modular architecture

let db;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FacultyUltimateDB', 5);
        
        request.onerror = () => reject('Database failed to open');
        
        request.onsuccess = () => {
            db = request.result;
            console.log('✅ Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            const tx = e.target.transaction;
            
            try {
                // Classes store
                if (!db.objectStoreNames.contains('classes')) {
                    const classStore = db.createObjectStore('classes', { keyPath: 'id', autoIncrement: true });
                    classStore.createIndex('name', 'name', { unique: false });
                    console.log('✅ Classes store created');
                }
                
                // Students store
                if (!db.objectStoreNames.contains('students')) {
                    const studentStore = db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
                    studentStore.createIndex('classId', 'classId', { unique: false });
                    studentStore.createIndex('regNo', 'regNo', { unique: false });
                    console.log('✅ Students store created');
                }
                
                // Attendance store
                if (!db.objectStoreNames.contains('attendance')) {
                    const attStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    attStore.createIndex('classId', 'classId', { unique: false });
                    attStore.createIndex('date', 'date', { unique: false });
                    console.log('✅ Attendance store created');
                }
                
                // Student details store
                if (!db.objectStoreNames.contains('studentDetails')) {
                    const detailsStore = db.createObjectStore('studentDetails', { keyPath: 'id', autoIncrement: true });
                    detailsStore.createIndex('studentId', 'studentId', { unique: false });
                    console.log('✅ Student details store created');
                }
                
                // Import log store (v5) - for tracking token imports
                if (!db.objectStoreNames.contains('importLog')) {
                    const logStore = db.createObjectStore('importLog', { keyPath: 'id', autoIncrement: true });
                    logStore.createIndex('classId', 'classId', { unique: false });
                    logStore.createIndex('date', 'date', { unique: false });
                    console.log('✅ Import log store created (v5)');
                }
                
                console.log('✅ Database schema created/upgraded to version 5');
            } catch (error) {
                console.error('❌ Database upgrade failed:', error);
                tx.abort();
                reject('Database upgrade failed: ' + error.message);
            }
        };
    });
}

// Get all records from a store
async function getAll(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Failed to get records');
    });
}

// Get single record by ID
async function getLog(storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Failed to get record');
    });
}

// Export to global scope
window.DB = {
    initDB,
    getAll,
    getLog
};

// Also expose db variable globally for backward compatibility
Object.defineProperty(window, 'db', {
    get: () => db,
    set: (value) => { db = value; }
});

console.log('✅ Database module loaded (IndexedDB)');
