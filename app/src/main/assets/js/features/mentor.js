// FacultyPro - Mentor Panel Module
// Handles token import, consolidation, and student format sharing

const Mentor = {
    // State
    mentorClassId: null,
    todayImports: [],  // [{subject, faculty, timestamp, recordCount}]

    // Initialize
    init() {
        this.mentorClassId = localStorage.getItem('mentorClassId');
        if (this.mentorClassId) {
            this.loadTodayImports();
            this.loadStudentCount();
        }
    },

    // Open Mentor Panel
    openPanel() {
        this.mentorClassId = localStorage.getItem('mentorClassId');
        
        // H3 FIX: Don't navigate if no mentor class
        if (!this.mentorClassId) {
            UI.showToast('Please set your mentor class in Settings first');
            // Open settings instead
            if (window.UI && UI.nav) {
                UI.nav('page-settings');
            }
            return;
        }
        
        // Update panel header
        const cls = window.classes?.find(c => c.id == this.mentorClassId);
        const nameEl = document.getElementById('mentor-class-name');
        if (nameEl && cls) {
            nameEl.innerText = cls.name;
        }
        
        this.loadTodayImports();
        this.loadStudentCount();
        UI.nav('page-mentor-panel');
    },

    // Load student count for this class
    async loadStudentCount() {
        if (!db || !this.mentorClassId) return;
        
        const tx = db.transaction('students', 'readonly');
        const store = tx.objectStore('students');
        const index = store.index('classId');
        
        index.getAll(parseInt(this.mentorClassId, 10)).onsuccess = e => {
            const students = e.target.result;
            const countEl = document.getElementById('mentor-student-count');
            if (countEl) {
                countEl.innerText = `${students.length} students`;
            }
        };
        
        // Add error handler (M1 fix)
        index.onerror = () => {
            const countEl = document.getElementById('mentor-student-count');
            if (countEl) countEl.innerText = 'Error loading count';
        };
    },

    // Load today's import log
    async loadTodayImports() {
        if (!db) return;
        
        const today = new Date().toLocaleDateString('en-CA');
        
        try {
            const tx = db.transaction('importLog', 'readonly');
            const store = tx.objectStore('importLog');
            
            store.getAll().onsuccess = e => {
                const all = e.target.result || [];
                this.todayImports = all.filter(log => 
                    log.classId == this.mentorClassId && log.date === today
                );
                this.renderImportLog();
            };
        } catch (e) {
            // importLog store may not exist yet
            console.log('Import log not available:', e);
            this.todayImports = [];
            this.renderImportLog();
        }
    },

    // Paste token from clipboard
    async pasteFromClipboard() {
        const token = await TokenUtils.readFromClipboard();
        const textarea = document.getElementById('mentor-token-input');
        
        if (token && textarea) {
            textarea.value = token;
            UI.showToast('Token pasted!');
        } else {
            UI.showToast('Clipboard empty or access denied');
        }
    },

    // Import faculty attendance token
  async importFacultyToken() {
    const btn = document.querySelector('button[onclick="Mentor.importFacultyToken()"]');
    const originalText = btn ? btn.innerHTML : '✅ IMPORT';
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Importing...';
        }

        const textarea = document.getElementById("mentor-token-input");
        const token = textarea?.value?.trim();
    
        if (!token) {
          throw new Error("Please paste a token first");
        }
    
        const result = TokenUtils.decode(token);
    
        if (!result.success) {
          throw new Error("Invalid token: " + result.error);
        }
    
        if (result.type !== "FACULTY_ATTENDANCE") {
          throw new Error("Wrong token type. Expected attendance token.");
        }
    
        const data = result.payload;
        
        // H2 FIX: Validate token timestamp (24 hour window)
        if (data.timestamp) {
            const tokenAge = Date.now() - data.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            if (tokenAge > maxAge) {
                throw new Error('Token expired (older than 24 hours)');
            }
        }
        
        // H1 FIX: Validate not empty
        if (!data.records || Object.keys(data.records).length === 0) {
            throw new Error('Token contains no attendance records');
        }
    
        // Validate class match (strict with radix)
        if (!this.mentorClassId) {
          throw new Error('No mentor class set');
        }
        if (parseInt(data.classId, 10) !== parseInt(this.mentorClassId, 10)) {
          throw new Error(`Token is for different class!`);
        }
    
        // Store in attendance with subject
        await this.storeSubjectAttendance(data);
    
        // Log the import
        await this.logImport(data);
    
        // Clear textarea
        textarea.value = "";
    
        // Refresh display
        this.loadTodayImports();
    
        UI.showToast(`✅ ${data.subject} attendance imported!`);
        
    } catch (e) {
        UI.showToast(e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
  },

    // Store subject-wise attendance
    async storeSubjectAttendance(data) {
        if (!db) throw new Error('Database not available');
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction('attendance', 'readwrite');
            const store = tx.objectStore('attendance');
            
            const classId = parseInt(data.classId, 10);
            const record = {
                classId: classId,
                date: data.date,
                subject: (data.subject || 'General').trim(), // H6 FIX: Normalize
                faculty: data.faculty,
                facultyEmail: data.facultyEmail || '',
                timestamp: data.timestamp || Date.now(),
                status: 'imported',
                records: data.records
            };
            
            // Use cursor to find existing record atomically
            const index = store.index('classId');
            const range = IDBKeyRange.only(classId);
            const cursorRequest = index.openCursor(range);
            
            let found = false;
            
            cursorRequest.onsuccess = e => {
                const cursor = e.target.result;
                if (cursor && !found) {
                    const existing = cursor.value;
                    if (existing.date === data.date && existing.subject === data.subject) {
                        record.id = existing.id;
                        found = true;
                        store.put(record);
                    } else {
                        cursor.continue();
                    }
                } else if (!found && !cursor) {
                    // No existing record found, insert new
                    store.add(record);
                }
            };
            
            cursorRequest.onerror = () => reject(cursorRequest.error);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // Log import for tracking
    async logImport(data) {
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction('importLog', 'readwrite');
                const store = tx.objectStore('importLog');
                
                const log = {
                    classId: parseInt(data.classId, 10),
                    date: data.date,
                    subject: data.subject,
                    faculty: data.faculty,
                    importedAt: Date.now(),
                    recordCount: Object.keys(data.records).length,
                    presentCount: data.presentCount || 0
                };
                
                store.add(log);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            } catch (e) {
                console.log('Could not log import:', e);
                resolve(); // Don't fail if logging fails
            }
        });
    },

    // Render import log
    renderImportLog() {
        const container = document.getElementById('mentor-import-log');
        if (!container) return;
        
        if (this.todayImports.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No imports today yet</p>';
            return;
        }
        
        container.innerHTML = this.todayImports.map(log => `
            <div class="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div class="flex items-center gap-3">
                    <span class="text-green-400 text-lg">✅</span>
                    <div>
                        <span class="text-white font-medium">${log.subject}</span>
                        <p class="text-xs text-gray-500">${log.faculty} • ${log.recordCount} students</p>
                    </div>
                </div>
                <span class="text-xs text-gray-400">${new Date(log.importedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `).join('');
    },

    // 9.1.1: Get all students for a class (with essential details)
    async getClassStudents(classId) {
        if (!db) return [];
        
        return new Promise((resolve) => {
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const index = store.index('classId');
            
            index.getAll(parseInt(classId, 10)).onsuccess = e => {
                const students = e.target.result || [];
                // Return only essential fields to keep token size small
                resolve(students.map(s => ({
                    id: s.id,
                    regNo: s.regNo,
                    name: s.name
                })));
            };
            
            index.onerror = () => resolve([]);
        });
    },

    // Generate student format token
    async generateFormatToken() {
        if (!this.mentorClassId) {
            return UI.showToast('Set your mentor class first');
        }
        
        // Get students for this class
        const tx = db.transaction('students', 'readonly');
        const store = tx.objectStore('students');
        const index = store.index('classId');
        
        index.getAll(parseInt(this.mentorClassId, 10)).onsuccess = async e => {
            const students = e.target.result;
            
            if (students.length === 0) {
                return UI.showToast('No students in this class. Add students first.');
            }
            
            const cls = window.classes?.find(c => c.id == this.mentorClassId);
            
            const data = {
                classId: parseInt(this.mentorClassId, 10),
                className: cls?.name || 'Unknown',
                mentor: localStorage.getItem('facultyName') || 'Mentor',
                mentor1: localStorage.getItem('mentor1_name') || localStorage.getItem('facultyName') || 'Mentor 1',
                mentor2: localStorage.getItem('mentor2_name') || '',
                mentorEmail: localStorage.getItem('facultypro_user_email') || '',
                students: students.map(s => ({
                    id: s.id,
                    regNo: s.regNo,
                    name: s.name
                }))
            };
            
            const token = TokenUtils.encode(data, 'STUDENT_FORMAT');
            
            if (token) {
                const copied = await TokenUtils.copyToClipboard(token);
                if (copied) {
                    UI.showToast(`📋 Format token copied! Share with faculty who teach this class.`);
                } else {
                    // M5 FIX: Use modal instead of prompt
                    if (typeof Attendance !== 'undefined' && Attendance.showTokenModal) {
                        Attendance.showTokenModal(token);
                    } else {
                        alert('Token generated but clipboard access failed. Token: ' + token.substring(0, 50) + '...');
                    }
                }
            }
        };
    },

    // Generate consolidated report for HOD
  async generateConsolidatedReport() {
    const btn = document.querySelector('button[onclick="Mentor.generateConsolidatedReport()"]');
    const originalText = btn ? btn.innerHTML : '📤 SEND REPORT TO HOD';
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Generating...';
        }

        if (!this.mentorClassId) {
            throw new Error('Set your mentor class first');
        }

        const today = new Date().toLocaleDateString("en-CA");
    
        // Get all attendance for this class today
        const tx = db.transaction("attendance", "readonly");
        const store = tx.objectStore("attendance");
        const index = store.index("classId");
    
        const allRecords = await new Promise((resolve) => {
          index.getAll(parseInt(this.mentorClassId, 10)).onsuccess = (e) =>
            resolve(e.target.result);
        });
    
        const todayRecords = allRecords.filter((r) => r.date === today);
    
        if (todayRecords.length === 0) {
          throw new Error("No attendance recorded today");
        }
    
        // Build consolidated report
        const cls = window.classes?.find((c) => c.id == this.mentorClassId);
        const subjects = {};
    
        todayRecords.forEach((r) => {
          subjects[r.subject] = {
            faculty: r.faculty || 'Unknown',
            records: r.records,
            presentCount: Object.values(r.records).filter((s) => s === "Present")
              .length,
            totalCount: Object.keys(r.records).length,
          };
        });
        // 9.1.2: Get all students for this class to include in consolidated report
        const students = await this.getClassStudents(this.mentorClassId);

        const data = {
          classId: parseInt(this.mentorClassId, 10),
          className: cls?.name || 'Unknown',
          date: today,
          mentor: localStorage.getItem("facultyName") || 'Mentor',
          mentor1: localStorage.getItem('mentor1_name') || localStorage.getItem('facultyName') || 'Mentor 1',
          mentor2: localStorage.getItem('mentor2_name') || '',
          mentorEmail: localStorage.getItem("facultypro_user_email") || '',
          subjectCount: Object.keys(subjects).length,
          students: students,  // Include full student list
          subjects: subjects,
        };
    
        const token = TokenUtils.encode(data, "CONSOLIDATED_REPORT");
    
        if (token) {
          const copied = await TokenUtils.copyToClipboard(token);
          if (copied) {
            UI.showToast(`📊 Report copied! ${students.length} students, ${data.subjectCount} subjects.`);
          } else {
             UI.showToast("Token generated but copy failed. Check logs."); 
          }
        }
    } catch(e) {
        UI.showToast(e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
  }
};

// Export to global scope
window.Mentor = Mentor;

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Delay init to ensure DB is ready
    setTimeout(() => Mentor.init(), 500);
});

console.log('✅ Mentor module loaded');
