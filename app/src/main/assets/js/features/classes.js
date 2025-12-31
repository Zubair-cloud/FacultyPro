// FacultyPro - Class Management Feature Module
// Extracted from attendance.html for modular architecture

const Classes = {
    // State
    classes: [],

    // Load all classes
    loadClasses() {
        if (!db) return;
        const tx = db.transaction('classes', 'readonly');
        tx.objectStore('classes').getAll().onsuccess = e => {
            this.classes = e.target.result;
            window.classes = this.classes; // For backward compatibility
            this.renderHomeList();
            this.loadManageClasses(); // Populate all dropdowns
        };
    },

    // Render class list on home page
    renderHomeList() {
        const list = document.getElementById('home-class-list');
        list.innerHTML = '';
        
        if (this.classes.length === 0) {
            list.innerHTML = `
                <div class="glass-card p-8 text-center rounded-2xl col-span-full">
                    <span class="material-symbols-outlined text-4xl text-gray-600 mb-2">calendar_today</span>
                    <p class="text-gray-400">No classes yet.</p>
                </div>
            `;
            return;
        }
        
        this.classes.forEach(c => {
            const div = document.createElement('div');
            div.className = 'glass-card p-4 rounded-2xl flex justify-between items-center active:bg-white/5 transition cursor-pointer border-l-4 border-primary hover:bg-white/5';
            div.onclick = () => Attendance.openAttendance(c);
            div.innerHTML = `
                <div>
                    <h3 class="text-lg font-bold text-white">${c.name}</h3>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="material-symbols-outlined text-gray-400 text-sm">schedule</span>
                        <p class="text-sm text-gray-400 font-medium">${c.time || 'Flexible'}</p>
                    </div>
                </div>
                <button class="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform hover:scale-110">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            `;
            list.appendChild(div);
        });
    },

    // Open add class modal
    addClass() {
        document.getElementById('modal-class-title').innerText = "Create New Class";
        document.getElementById('edit-class-id').value = "";
        document.getElementById('new-class-name').value = "";
        document.getElementById('new-class-time').value = "";
        UI.openModal('modal-add-class');
    },

    // Save class to database
    saveClassToDB() {
        if (!db) return UI.showToast("DB Loading...");
        
        const id = document.getElementById('edit-class-id').value;
        const name = document.getElementById('new-class-name').value;
        const time = document.getElementById('new-class-time').value;
        
        if (!name) return UI.showToast("Name required");
        
        const btn = document.getElementById('btn-save-class');
        const originalText = btn.innerText;
        btn.innerText = "Saving...";
        btn.disabled = true;
        
        const tx = db.transaction('classes', 'readwrite');
        const store = tx.objectStore('classes');
        
        if (id) {
            store.get(parseInt(id)).onsuccess = e => {
                const data = e.target.result;
                if (data) {
                    data.name = name;
                    data.time = time;
                    store.put(data);
                }
            };
        } else {
            store.add({ name, time });
        }
        
        tx.oncomplete = () => {
            UI.closeModal('modal-add-class');
            this.loadClasses();
            this.loadManageClasses();
            UI.showToast(id ? "Class Updated" : "Class Created");
            btn.innerText = originalText;
            btn.disabled = false;
        };
        
        tx.onerror = () => {
            UI.showToast("Error Saving Class");
            btn.innerText = originalText;
            btn.disabled = false;
        };
    },

    // Load classes for manage page
    loadManageClasses() {
        if (!db) return;
        const sel = [
            document.getElementById('manage-class-select'),
            document.getElementById('hist-class-select'),
            document.getElementById('backlog-class-select'),
            document.getElementById('timing-class-select'),
            document.getElementById('analytics-class-select')
        ];
        
        const tx = db.transaction('classes', 'readonly');
        tx.objectStore('classes').getAll().onsuccess = e => {
            const classes = e.target.result;
            sel.forEach(s => {
                if (s) {
                    s.innerHTML = '<option value="">Select Class</option>';
                    classes.forEach(c => {
                        s.innerHTML += `<option value="${c.id}">${c.name}</option>`;
                    });
                }
            });
        };
    },

    // Edit class timing
    triggerEditTimings() {
        this.loadManageClasses();
        UI.openModal('modal-edit-timings');
    },

    onTimingClassSelect() {
        const id = document.getElementById('timing-class-select').value;
        if (!id) return;
        
        const cls = this.classes.find(c => c.id == id);
        if (cls) {
            document.getElementById('timing-new-time').value = cls.time || '';
        }
    },

    updateClassTiming() {
        const id = document.getElementById('timing-class-select').value;
        const newTime = document.getElementById('timing-new-time').value;
        
        if (!id) return UI.showToast("Select a class");
        if (!newTime) return UI.showToast("Enter new time");
        
        const tx = db.transaction('classes', 'readwrite');
        const store = tx.objectStore('classes');
        
        store.get(parseInt(id)).onsuccess = e => {
            const data = e.target.result;
            if (data) {
                data.time = newTime;
                store.put(data);
            }
        };
        
        tx.oncomplete = () => {
            UI.closeModal('modal-edit-timings');
            this.loadClasses();
            UI.showToast("Timing Updated");
        };
    },

    // Delete current class from manage page
    deleteCurrentClass() {
        const clsId = document.getElementById('manage-class-select').value;
        if (!clsId) return UI.showToast("Select a class first");
        
        const cls = this.classes.find(c => c.id == clsId);
        if (!cls) return;
        
        if (!confirm(`Delete "${cls.name}" and ALL its students and attendance records?`)) return;
        
        const tx = db.transaction(['classes', 'students', 'attendance'], 'readwrite');
        
        tx.objectStore('classes').delete(parseInt(clsId));
        
        const studentStore = tx.objectStore('students');
        const studentIndex = studentStore.index('classId');
        studentIndex.openCursor(IDBKeyRange.only(parseInt(clsId))).onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        
        const attStore = tx.objectStore('attendance');
        const attIndex = attStore.index('classId');
        attIndex.openCursor(IDBKeyRange.only(parseInt(clsId))).onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        
        tx.oncomplete = () => {
            this.loadClasses();
            this.loadManageClasses();
            document.getElementById('manage-list').innerHTML = '';
            UI.showToast("Class Deleted");
        };
    }
};

// Export to global scope
window.Classes = Classes;

// For backward compatibility
window.loadClasses = () => Classes.loadClasses();
window.renderHomeList = () => Classes.renderHomeList();
window.saveClassToDB = () => Classes.saveClassToDB();
window.loadManageClasses = () => Classes.loadManageClasses();
window.triggerEditTimings = () => Classes.triggerEditTimings();
window.onTimingClassSelect = () => Classes.onTimingClassSelect();
window.updateClassTiming = () => Classes.updateClassTiming();
window.deleteCurrentClass = () => Classes.deleteCurrentClass();

// Expose classes array
Object.defineProperty(window, 'classes', {
    get: () => Classes.classes,
    set: (v) => { Classes.classes = v; }
});

console.log('✅ Classes module loaded');
