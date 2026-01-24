// FacultyPro - Backup & Restore Module
// Extracted from attendance.html for modular architecture

const Backup = {
    // 1. Backup Data
    async backupData() {
        try {
            // Fix: Use correct localStorage keys that match loadProfile/saveProfile
            const profile = {
                name: localStorage.getItem('facultyName') || localStorage.getItem('fac_name'),
                phone: localStorage.getItem('facultyPhone') || localStorage.getItem('fac_id'),
                subject: localStorage.getItem('facultySubject') || localStorage.getItem('fac_subject')
            };

            const getAll = (store) => new Promise((resolve, reject) => {
                 const tx = db.transaction(store, 'readonly');
                 const req = tx.objectStore(store).getAll();
                 req.onsuccess = () => resolve(req.result);
                 req.onerror = () => reject(req.error);
            });

            const data = {
                classes: await getAll('classes'),
                students: await getAll('students'),
                attendance: await getAll('attendance'),
                profile: profile,
                timestamp: Date.now()
            };

            const json = JSON.stringify(data, null, 2);
            const fileName = 'facultypro_backup_' + new Date().toISOString().split('T')[0] + '.json';

            // Use Android native method if available
            if (typeof Android !== 'undefined' && Android.saveToDownloads) {
                Android.saveToDownloads(json, fileName, 'application/json');
            } else {
                // Browser fallback
                const blob = new Blob([json], {type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
            }
            UI.showToast('Backup Downloaded');
        } catch (e) {
            console.error('Backup failed:', e);
            UI.showToast('Backup Failed: ' + e.message);
        }
    },

    // 2. Trigger Restore (File Picker)
    triggerRestore() {
        if (typeof Android !== 'undefined' && Android.openFilePicker) {
            Android.openFilePicker();
        } else {
            document.getElementById('restore-file').click();
        }
    },

    // 3. Handle File Input (Browser Logic)
    restoreData(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            this.restoreFromJSON(e.target.result);
        };
        reader.readAsText(file);
    },

    // 4. Android Native Restore Entry Point
    androidRestore(jsonContent) {
        this.restoreFromJSON(jsonContent);
    },

    // 5. Core Restore Logic
    async restoreFromJSON(jsonString) {
        try {
            let data;
            try {
                data = JSON.parse(jsonString);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                return UI.showToast('Parsing Error: File is corrupted or invalid.');
            }

            if (!data.classes || !Array.isArray(data.classes)) {
                return UI.showToast('Invalid backup: No class data found');
            }

            // SECURITY: Ensure we DO NOT restore license data even if present
            if (data.profile) {
                delete data.profile.license_token;
                delete data.profile.user_role;
                delete data.profile.user_email;
            }

            const confirmed = await UI.showConfirm(
                'Restore Data?',
                'This will REPLACE all current data. You will need to SIGN IN again to verify your license.'
            );

            if (!confirmed) return;

            UI.showToast('Restoring data...');

            // Clear existing data
            const stores = ['classes', 'students', 'attendance', 'studentDetails'];
            const txClear = db.transaction(stores, 'readwrite');
            stores.forEach(name => txClear.objectStore(name).clear());
            
            await new Promise(resolve => txClear.oncomplete = resolve);

            const tx = db.transaction(stores, 'readwrite');

            // 1. Restore Classes
            const classStore = tx.objectStore('classes');
            if (data.classes && Array.isArray(data.classes)) {
                data.classes.forEach(c => classStore.put(c));
            }

            // 2. Restore Students
            const studentStore = tx.objectStore('students');
            if (data.students && Array.isArray(data.students)) {
                data.students.forEach(s => studentStore.put(s));
            }

            // 3. Restore Attendance
            const attStore = tx.objectStore('attendance');
            if (data.attendance && Array.isArray(data.attendance)) {
                data.attendance.forEach(a => attStore.put(a));
            }

            // 4. Restore Profile (Exclude License)
            if (data.profile) {
                 if (data.profile.name) localStorage.setItem('facultyName', data.profile.name);
                 if (data.profile.phone) localStorage.setItem('facultyPhone', data.profile.phone);
                 if (data.profile.subject) localStorage.setItem('facultySubject', data.profile.subject);
            }

            // Reset License Data to Standard (User must sign in)
            localStorage.removeItem('facultypro_license_token');
            localStorage.removeItem('facultypro_user_role');
            localStorage.removeItem('facultypro_user_email');

            tx.oncomplete = () => {
                UI.showToast('Restore Complete! Please Sign In.');
                setTimeout(() => location.reload(), 1500);
            };

            tx.onerror = (e) => {
                console.error('Restore failed:', e);
                UI.showToast('Restore Failed: DB Error');
            };

        } catch (e) {
            console.error(e);
            UI.showToast('Error parsing backup file');
        }
    },

    // 6. Wipe Data
    async wipeData() {
        const confirmed = await UI.showConfirm(
            'Reset Everything?',
            'This will permanently delete all classes, students, and attendance records. This action cannot be undone.'
        );

        if (!confirmed) return;

        indexedDB.deleteDatabase('FacultyUltimateDB');
        localStorage.clear();
        UI.showToast('Data Wiped - Reloading...');
        setTimeout(() => location.reload(), 1500);
    }
};

// Export to global scope
window.Backup = Backup;

// For backward compatibility / HTML onclick bindings
window.backupData = () => Backup.backupData();
window.triggerRestore = () => Backup.triggerRestore();
window.restoreData = (input) => Backup.restoreData(input);
window.androidRestore = (json) => Backup.androidRestore(json);
window.wipeData = () => Backup.wipeData();

console.log('✅ Backup module loaded');
