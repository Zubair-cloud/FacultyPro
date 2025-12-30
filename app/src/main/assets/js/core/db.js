// FacultyPro - Database Layer (IndexedDB)
// Extracted from attendance.html for modular architecture

let db;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FacultyUltimateDB', 4);
        
        request.onerror = () => reject('Database failed to open');
        
        request.onsuccess = () => {
            db = request.result;
            console.log('✅ Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            
            // Classes store
            if (!db.objectStoreNames.contains('classes')) {
                const classStore = db.createObjectStore('classes', { keyPath: 'id', autoIncrement: true });
                classStore.createIndex('name', 'name', { unique: false });
            }
            
            // Students store
            if (!db.objectStoreNames.contains('students')) {
                const studentStore = db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
                studentStore.createIndex('classId', 'classId', { unique: false });
                studentStore.createIndex('regNo', 'regNo', { unique: false });
            }
            
            // Attendance store
            if (!db.objectStoreNames.contains('attendance')) {
                const attStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                attStore.createIndex('classId', 'classId', { unique: false });
                attStore.createIndex('date', 'date', { unique: false });
            }
            
            // Student details store
            if (!db.objectStoreNames.contains('studentDetails')) {
                const detailsStore = db.createObjectStore('studentDetails', { keyPath: 'id', autoIncrement: true });
                detailsStore.createIndex('studentId', 'studentId', { unique: false });
            }
            
            console.log('✅ Database schema created/upgraded to version 4');
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
