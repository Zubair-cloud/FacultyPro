// FacultyPro - Attendance Feature Module
// Extracted from attendance.html for modular architecture

const Attendance = {
    // State
    activeClass: null,
    tempAttendance: {},
    currentStudents: [],
    currentAttendanceDate: new Date().toLocaleDateString('en-CA'),
    viewMode: 'normal', // 'normal', 'history', 'backlog'
    lateEntryTimer: null,
    lateEntryEndTime: null,

    // Open attendance page for a class
    async openAttendance(cls) {
        this.activeClass = cls;
        this.viewMode = 'normal';
        this.updateModeBanner();
        UI.nav('page-attendance');
        
        document.getElementById('att-title').innerText = cls.name;
        const today = new Date().toLocaleDateString('en-CA');
        document.getElementById('att-date-input').value = today;
        document.getElementById('att-date-display').innerText = "Today";
        this.currentAttendanceDate = today;
        this.loadAttendanceForDate(today);
    },

    // Navigate to history view (read-only)
    goToHistoryView() {
        const clsId = document.getElementById('hist-class-select').value;
        const date = document.getElementById('hist-date-input').value;
        if (!clsId || !date) return UI.showToast("Select class and date");
        
        const cls = classes.find(c => c.id == clsId);
        if (!cls) return;
        
        this.activeClass = cls;
        this.viewMode = 'history';
        this.currentAttendanceDate = date;
        
        UI.nav('page-attendance');
        document.getElementById('att-title').innerText = cls.name;
        document.getElementById('att-date-input').value = date;
        
        const dateObj = new Date(date);
        document.getElementById('att-date-display').innerText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        this.updateModeBanner();
        this.loadAttendanceForDate(date);
    },

    // Navigate to backlog add (editable)
    goToBacklogAdd() {
        const clsId = document.getElementById('backlog-class-select').value;
        const date = document.getElementById('backlog-date-input').value;
        if (!clsId || !date) return UI.showToast("Select class and date");
        
        const cls = classes.find(c => c.id == clsId);
        if (!cls) return;
        
        this.activeClass = cls;
        this.viewMode = 'backlog';
        this.currentAttendanceDate = date;
        
        UI.nav('page-attendance');
        document.getElementById('att-title').innerText = cls.name;
        document.getElementById('att-date-input').value = date;
        
        const dateObj = new Date(date);
        document.getElementById('att-date-display').innerText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        this.updateModeBanner();
        this.loadAttendanceForDate(date);
    },

    // Update mode banner (history/backlog indicator)
    updateModeBanner() {
        const banner = document.getElementById('mode-banner');
        const icon = document.getElementById('mode-icon');
        const text = document.getElementById('mode-text');
        const navButtons = document.getElementById('history-nav-buttons');
        const dateInput = document.getElementById('att-date-input');
        const attDock = document.getElementById('attendance-dock');
        
        if (this.viewMode === 'history') {
            banner.classList.remove('hidden');
            banner.className = 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-3 text-center';
            icon.innerText = 'history_edu';
            text.innerText = 'Viewing History (Read-Only)';
            navButtons.classList.remove('hidden');
            dateInput.style.display = 'none';
            if (attDock) attDock.style.transform = 'translateY(100%)';
        } else if (this.viewMode === 'backlog') {
            banner.classList.remove('hidden');
            banner.className = 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-b border-orange-500/20 p-3 text-center';
            icon.innerText = 'edit_calendar';
            text.innerText = 'Adding Backlog Attendance';
            navButtons.classList.add('hidden');
            dateInput.style.display = 'block';
            if (attDock) attDock.style.transform = 'translateY(0)';
        } else {
            banner.classList.add('hidden');
            navButtons.classList.add('hidden');
            dateInput.style.display = 'block';
            if (attDock) attDock.style.transform = 'translateY(0)';
        }
    },

    // Previous day navigation (history mode)
    navigatePrevDay() {
        const currentDate = new Date(this.currentAttendanceDate);
        currentDate.setDate(currentDate.getDate() - 1);
        const newDate = currentDate.toLocaleDateString('en-CA');
        
        this.currentAttendanceDate = newDate;
        document.getElementById('att-date-input').value = newDate;
        document.getElementById('att-date-display').innerText = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        this.loadAttendanceForDate(newDate);
    },

    // Next day navigation (history mode)
    navigateNextDay() {
        const currentDate = new Date(this.currentAttendanceDate);
        currentDate.setDate(currentDate.getDate() + 1);
        const newDate = currentDate.toLocaleDateString('en-CA');
        
        this.currentAttendanceDate = newDate;
        document.getElementById('att-date-input').value = newDate;
        document.getElementById('att-date-display').innerText = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        this.loadAttendanceForDate(newDate);
    },

    // Load attendance for a specific date
    async loadAttendanceForDate(date) {
        if (!db || !this.activeClass) return;
        
        const tx = db.transaction('students', 'readonly');
        const studentStore = tx.objectStore('students');
        const index = studentStore.index('classId');
        
        index.getAll(this.activeClass.id).onsuccess = async (e) => {
            this.currentStudents = e.target.result;
            
            const attTx = db.transaction('attendance', 'readonly');
            const attStore = attTx.objectStore('attendance');
            const attIndex = attStore.index('classId');
            
            attIndex.getAll(this.activeClass.id).onsuccess = (ae) => {
                const allRecords = ae.target.result;
                const todayRecord = allRecords.find(r => r.date === date);
                const isLocked = todayRecord && todayRecord.status === 'final';
                
                this.renderAttendanceList(todayRecord ? todayRecord.records : null, isLocked);
                
                if (todayRecord && todayRecord.status === 'draft' && date === new Date().toLocaleDateString('en-CA')) {
                    this.startLateEntryTimer();
                }
            };
        };
    },

    // Render attendance list
    renderAttendanceList(savedRecords, isLocked) {
        const list = document.getElementById('att-student-list');
        list.innerHTML = '';
        
        document.getElementById('att-total-count').innerText = this.currentStudents.length;
        
        // Show "No Attendance Recorded" message in history mode if no data
        if (this.viewMode === 'history' && !savedRecords) {
            list.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center p-12 text-center">
                    <div class="size-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-5xl text-blue-400">history_edu</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">No Attendance Recorded</h3>
                    <p class="text-gray-400 text-sm">No attendance was recorded for this date.</p>
                    <p class="text-gray-500 text-xs mt-2">Use the Backlog feature to add it.</p>
                </div>
            `;
            return;
        }
        
        this.currentStudents.forEach(s => {
            let status = 'Present';
            if (savedRecords && savedRecords[s.id]) status = savedRecords[s.id];
            this.tempAttendance[s.id] = status;
            
            const div = document.createElement('div');
            div.className = 'glass-card p-3 rounded-xl flex justify-between items-center transition-all duration-300';
            
            let btnClass = status === 'Present' 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border-red-500/30';
            let btnDisabled = '';
            let btnCursor = '';
            
            if (this.viewMode === 'history') {
                btnClass += ' opacity-60 cursor-not-allowed';
                btnDisabled = 'disabled';
                btnCursor = 'style="pointer-events: none;"';
            }
            
            div.innerHTML = `<div class="flex items-center gap-3"><div class="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 font-bold text-sm border border-white/10">${s.regNo.slice(-2)}</div><div><p class="text-white font-semibold text-sm">${s.name}</p><p class="text-xs text-gray-500">${s.regNo}</p></div></div><button id="btn-${s.id}" onclick="Attendance.toggleStd(${s.id}, ${isLocked})" class="h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 ${btnClass}" ${btnDisabled} ${btnCursor}>${status === 'Present' ? 'PRESENT' : 'ABSENT'}</button>`;
            list.appendChild(div);
        });
    },

    // Toggle student attendance
    toggleStd(id, isLocked) {
        if (this.viewMode === 'history') {
            return UI.showToast("History is Read-Only");
        }
        if (isLocked) return UI.showToast("Attendance Locked");
        
        const curr = this.tempAttendance[id];
        const next = curr === 'Present' ? 'Absent' : 'Present';
        this.tempAttendance[id] = next;
        
        const btn = document.getElementById(`btn-${id}`);
        if (next === 'Present') {
            btn.className = "h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 bg-green-500/20 text-green-400 border-green-500/30";
            btn.innerText = "PRESENT";
        } else {
            btn.className = "h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 bg-red-500/20 text-red-400 border-red-500/30";
            btn.innerText = "ABSENT";
        }
    },

    // Toggle all present
    toggleAllPresent() {
        Object.keys(this.tempAttendance).forEach(id => {
            this.tempAttendance[id] = 'Present';
            const btn = document.getElementById(`btn-${id}`);
            if (btn) {
                btn.className = "h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 bg-green-500/20 text-green-400 border-green-500/30";
                btn.innerText = "PRESENT";
            }
        });
        UI.showToast("Marked All Present");
    },

    // Save attendance
    saveAttendance(mode) {
        if (this.viewMode === 'history') {
            return UI.showToast("Cannot save in history view");
        }
        
        if (!this.activeClass) return;
        
        const record = {
            classId: this.activeClass.id,
            date: this.currentAttendanceDate,
            timestamp: Date.now(),
            status: mode,
            records: this.tempAttendance
        };
        
        const tx = db.transaction('attendance', 'readwrite');
        const store = tx.objectStore('attendance');
        const idx = store.index('classId');
        
        idx.getAll(this.activeClass.id).onsuccess = e => {
            const all = e.target.result;
            const exist = all.find(x => x.date === record.date);
            if (exist) record.id = exist.id;
            store.put(record);
            
            tx.oncomplete = () => {
                UI.showToast(mode === 'final' ? "Locked & Saved" : "Late Entry Active");
                
                const today = new Date().toLocaleDateString('en-CA');
                if (mode === 'draft' && this.currentAttendanceDate === today) {
                    this.startLateEntryTimer();
                } else {
                    this.stopLateEntryTimer();
                }
            };
        };
    },

    // Late entry timer functions
    startLateEntryTimer() {
        this.lateEntryEndTime = Date.now() + (APP_CONFIG.lateEntryDuration * 1000);
        document.getElementById('late-entry-timer').classList.remove('hidden');
        
        this.lateEntryTimer = setInterval(() => {
            const remaining = Math.max(0, this.lateEntryEndTime - Date.now());
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            document.getElementById('timer-display').innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (remaining <= 0) {
                this.stopLateEntryTimer();
                this.saveAttendance('final');
            }
        }, 1000);
    },

    stopLateEntryTimer() {
        if (this.lateEntryTimer) {
            clearInterval(this.lateEntryTimer);
            this.lateEntryTimer = null;
        }
        document.getElementById('late-entry-timer').classList.add('hidden');
    },

    // Date change handler
    onDateChange(input) {
        const date = input.value;
        if (date) {
            this.currentAttendanceDate = date;
            const dateObj = new Date(date);
            const today = new Date().toLocaleDateString('en-CA');
            
            document.getElementById('att-date-display').innerText = date === today 
                ? "Today" 
                : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            this.loadAttendanceForDate(date);
        }
    }
};

// Export to global scope
window.Attendance = Attendance;

// For backward compatibility, expose functions globally
window.openAttendance = (cls) => Attendance.openAttendance(cls);
window.goToHistoryView = () => Attendance.goToHistoryView();
window.goToBacklogAdd = () => Attendance.goToBacklogAdd();
window.toggleStd = (id, locked) => Attendance.toggleStd(id, locked);
window.toggleAllPresent = () => Attendance.toggleAllPresent();
window.saveAttendance = (mode) => Attendance.saveAttendance(mode);
window.onDateChange = (input) => Attendance.onDateChange(input);
window.updateModeBanner = () => Attendance.updateModeBanner();
window.navigatePrevDay = () => Attendance.navigatePrevDay();
window.navigateNextDay = () => Attendance.navigateNextDay();

// Expose state variables for backward compatibility
Object.defineProperty(window, 'activeClass', {
    get: () => Attendance.activeClass,
    set: (v) => { Attendance.activeClass = v; }
});
Object.defineProperty(window, 'viewMode', {
    get: () => Attendance.viewMode,
    set: (v) => { Attendance.viewMode = v; }
});
Object.defineProperty(window, 'tempAttendance', {
    get: () => Attendance.tempAttendance,
    set: (v) => { Attendance.tempAttendance = v; }
});
Object.defineProperty(window, 'currentStudents', {
    get: () => Attendance.currentStudents,
    set: (v) => { Attendance.currentStudents = v; }
});
Object.defineProperty(window, 'currentAttendanceDate', {
    get: () => Attendance.currentAttendanceDate,
    set: (v) => { Attendance.currentAttendanceDate = v; }
});

console.log('✅ Attendance module loaded');
