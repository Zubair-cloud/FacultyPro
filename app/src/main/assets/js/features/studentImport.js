// FacultyPro - Student Format Import for Faculty
// This module allows faculty to import student roster shared by Mentor

const StudentImport = {
    // Import student format token from Mentor
    async importStudentFormat() {
        const textarea = document.getElementById('student-import-input');
        const token = textarea?.value?.trim();
        
        if (!token) {
            return UI.showToast('Please paste student format token');
        }
        
        if (!window.TokenUtils) {
            return UI.showToast('Token system not loaded');
        }
        
        const result = TokenUtils.decode(token);
        
        if (!result.success) {
            return UI.showToast('Invalid token: ' + result.error);
        }
        
        if (result.type !== 'STUDENT_FORMAT') {
            return UI.showToast('Wrong token type. Expected student format.');
        }
        
        const data = result.payload;
        
        // Confirm import
        const message = `Import ${data.students.length} students for class "${data.className}"?`;
        if (!confirm(message)) {
            return;
        }
        
        try {
            // Save class first
            await this.saveClass(data);
            
            // Save all students
            await this.saveStudents(data);
            
            textarea.value = '';
            UI.showToast(`✅ Imported ${data.students.length} students for ${data.className}`);
            
            // Refresh UI - Navigate to Manage page and show students
            setTimeout(() => {
                // Reload class dropdown first
                if (window.Classes && Classes.loadClasses) {
                    Classes.loadClasses();
                }
                
                // Navigate to manage page
                if (window.nav) {
                    nav('page-manage');
                } else if (window.UI && UI.nav) {
                    UI.nav('page-manage');
                }
                
                // After navigation, select the newly imported class
                setTimeout(() => {
                    const classSelect = document.getElementById('manage-class-select');
                    if (classSelect && data.classId) {
                        classSelect.value = data.classId;
                        // Load students for this class
                        if (window.Students && Students.loadManageList) {
                            Students.loadManageList();
                        } else if (window.loadManageList) {
                            loadManageList();
                        }
                    }
                }, 300);
            }, 200);
            
        } catch (e) {
            UI.showToast('Import failed: ' + e.message);
            console.error(e);
        }
    },
    
    // Save class to database
    async saveClass(data) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not available'));
                return;
            }
            
            const tx = db.transaction('classes', 'readwrite');
            const store = tx.objectStore('classes');
            
            // Check if class already exists
            store.getAll().onsuccess = e => {
                const classes = e.target.result;
                const existing = classes.find(c => c.name === data.className);
                
                if (existing) {
                    // Update existing
                    data.classId = existing.id;
                    console.log('Class already exists, using ID:', existing.id);
                } else {
                    // Add new class
                    const classRecord = {
                        name: data.className,
                        createdAt: Date.now()
                    };
                    store.add(classRecord).onsuccess = e => {
                        data.classId = e.target.result;
                        console.log('New class created with ID:', data.classId);
                    };
                }
            };
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    
    // Save students to database
    async saveStudents(data) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('students', 'readwrite');
            const store = tx.objectStore('students');
            
            data.students.forEach(student => {
                const record = {
                    classId: data.classId,
                    regNo: student.regNo,
                    name: student.name,
                    createdAt: Date.now()
                };
                
                // Check if student already exists (by regNo)
                const index = store.index('regNo');
                index.get(student.regNo).onsuccess = e => {
                    const existing = e.target.result;
                    if (existing) {
                        // Update existing student
                        record.id = existing.id;
                        store.put(record);
                    } else {
                        // Add new student
                        store.add(record);
                    }
                };
            });
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    
    // Paste from clipboard
    async pasteFromClipboard() {
        const token = await TokenUtils.readFromClipboard();
        const textarea = document.getElementById('student-import-input');
        
        if (token && textarea) {
            textarea.value = token;
            UI.showToast('Token pasted!');
        } else {
            UI.showToast('Clipboard empty or access denied');
        }
    }
};

window.StudentImport = StudentImport;
console.log('✅ Student Import module loaded');
