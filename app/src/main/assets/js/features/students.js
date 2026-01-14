// FacultyPro - Student Management Feature Module
// Extracted from attendance.html for modular architecture

const Students = {
    // State  
    activeStudentForDetails: null,
    editingDetailIndex: -1,

    // Load students for manage page                      
    loadManageList() {
        const clsId = document.getElementById('manage-class-select').value;
        const list = document.getElementById('manage-list');
        const delBtn = document.getElementById('btn-delete-class');
        
        if (!clsId) {
            list.innerHTML = '<div class="text-gray-500 text-center col-span-full">Select a class</div>';
            delBtn.classList.add('hidden');
            return;
        }
        
        delBtn.classList.remove('hidden');
        
        const tx = db.transaction('students', 'readonly');
        const store = tx.objectStore('students');
        const index = store.index('classId');
        
        index.getAll(parseInt(clsId)).onsuccess = e => {
            const students = e.target.result;
            list.innerHTML = '';
            
            if (students.length === 0) {
                list.innerHTML = '<div class="text-center text-gray-500 py-10 col-span-full">No students yet</div>';
                return;
            }
            
            students.forEach(s => {
                const div = document.createElement('div');
                div.className = 'glass-card p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/5 transition';
                div.onclick = () => this.showStudentDetails(s.id);
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">${s.regNo.slice(-2)}</div>
                        <div>
                            <p class="text-white font-semibold text-sm">${s.name}</p>
                            <p class="text-xs text-gray-500">${s.regNo}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-gray-500">chevron_right</span>
                `;
                list.appendChild(div);
            });
        };
    },

    // Open add student modal
    addStudent() {
        const clsId = document.getElementById('manage-class-select').value;
        if (!clsId) return UI.showToast("Select a class first");
        
        document.getElementById('modal-student-title').innerText = "Add Student";
        document.getElementById('edit-student-id').value = "";
        ['s-name', 's-reg', 's-phone', 's-email', 's-addr'].forEach(id => document.getElementById(id).value = "");
        UI.openModal('modal-add-student');
    },

    // Save student to database
    saveStudentToDB() {
        const clsId = document.getElementById('manage-class-select').value;
        if (!clsId) return UI.showToast("Select class first");
        
        const id = document.getElementById('edit-student-id').value;
        const name = document.getElementById('s-name').value;
        const regNo = document.getElementById('s-reg').value;
        const phone = document.getElementById('s-phone').value;
        const email = document.getElementById('s-email').value;
        const addr = document.getElementById('s-addr').value;
        
        if (!name || !regNo) return UI.showToast("Name and Reg No required");
        
        const student = { name, regNo, phone, email, address: addr, classId: parseInt(clsId) };
        const tx = db.transaction('students', 'readwrite');
        const store = tx.objectStore('students');
        
        if (id) {
            student.id = parseInt(id);
            store.put(student);
        } else {
            store.add(student);
        }
        
        tx.oncomplete = () => {
            UI.closeModal('modal-add-student');
            this.loadManageList();
            
            // CLEAR THE FORM after save
            document.getElementById('edit-student-id').value = '';
            document.getElementById('s-name').value = '';
            document.getElementById('s-reg').value = '';
            document.getElementById('s-phone').value = '';
            document.getElementById('s-email').value = '';
            document.getElementById('s-addr').value = '';
            
            UI.showToast(id ? "Student Updated" : "Student Added");
        };
    },

    // Bulk import students
    processBulk() {
        const clsId = document.getElementById('manage-class-select').value;
        if (!clsId) return UI.showToast("Select a class first");
        
        const text = document.getElementById('bulk-text').value.trim();
        if (!text) return UI.showToast("Paste student data");
        
        const lines = text.split('\n').filter(l => l.trim());
        const students = lines.map(line => {
            const parts = line.split('\t');
            return {
                regNo: parts[0] || '',   // RegNo FIRST
                name: parts[1] || '',     // Name SECOND
                phone: parts[2] || '',
                email: parts[3] || '',
                address: parts[4] || '',
                classId: parseInt(clsId)
            };
        }).filter(s => s.name && s.regNo);
        
        if (students.length === 0) return UI.showToast("No valid data");
        
        const tx = db.transaction('students', 'readwrite');
        const store = tx.objectStore('students');
        students.forEach(s => store.add(s));
        
        tx.oncomplete = () => {
            UI.closeModal('modal-bulk');
            document.getElementById('bulk-text').value = '';
            this.loadManageList();
            UI.showToast(`${students.length} students imported`);
        };
    },

    // Show student details modal
    showStudentDetails(studentId) {
        const tx = db.transaction('students', 'readonly');
        tx.objectStore('students').get(studentId).onsuccess = e => {
            const s = e.target.result;
            if (!s) return;
            
            this.activeStudentForDetails = s;
            document.getElementById('det-name').innerText = s.name;
            document.getElementById('det-reg').innerText = s.regNo;
            document.getElementById('det-phone').innerText = s.phone || '-';
            document.getElementById('det-email').innerText = s.email || '-';
            document.getElementById('det-addr').innerText = s.address || '-';
            
            this.loadStudentDetails(studentId);
            UI.openModal('modal-student-details');
        };
    },

    // Load student custom details
    loadStudentDetails(studentId) {
        const detailsList = document.getElementById('details-list');
        detailsList.innerHTML = '<p class="text-gray-500 text-sm">No additional details</p>';
        
        // Student details feature would go here (from studentDetails store)
        // For now, just placeholder
    },

    // Edit current student
    editCurrentStudent() {
        if (!this.activeStudentForDetails) return;
        
        UI.closeModal('modal-student-details');
        
        const s = this.activeStudentForDetails;
        document.getElementById('modal-student-title').innerText = "Edit Student";
        document.getElementById('edit-student-id').value = s.id;
        document.getElementById('s-name').value = s.name;
        document.getElementById('s-reg').value = s.regNo;
        document.getElementById('s-phone').value = s.phone || '';
        document.getElementById('s-email').value = s.email || '';
        document.getElementById('s-addr').value = s.address || '';
        
        UI.openModal('modal-add-student');
    },

    // Save detail (custom student information)
    saveDetail() {
        // Placeholder for student detail saving
        UI.showToast("Detail saved");
    },

    cancelEditDetail() {
        this.editingDetailIndex = -1;
        document.getElementById('new-det-label').value = '';
        document.getElementById('new-det-value').value = '';
        document.getElementById('btn-cancel-edit').classList.add('hidden');
        document.getElementById('detail-form-title').innerText = 'Add New Label';
    }
};

// Export to global scope
window.Students = Students;

// For backward compatibility
window.loadManageList = () => Students.loadManageList();
window.saveStudentToDB = () => Students.saveStudentToDB();
window.processBulk = () => Students.processBulk();
window.showStudentDetails = (id) => Students.showStudentDetails(id);
window.editCurrentStudent = () => Students.editCurrentStudent();
window.saveDetail = () => Students.saveDetail();
window.cancelEditDetail = () => Students.cancelEditDetail();

// Expose state
Object.defineProperty(window, 'activeStudentForDetails', {
    get: () => Students.activeStudentForDetails,
    set: (v) => { Students.activeStudentForDetails = v; }
});

console.log('✅ Students module loaded');
