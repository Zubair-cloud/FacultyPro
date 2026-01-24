// FacultyPro - HOD Panel Module
// Handles Department Level Operations

const HOD = {
    // State
    todayStatus: [], // [{classId, name, updatedSubjects, totalSubjects}]
    
    // 9.2.3: Undo system state
    undoBuffer: null,  // Stores old records before overwrite
    undoTimer: null,   // 60-second timer reference
    currentStudent: null, // For intervention letter
    
    // Initialize
    init() {
        this.loadDepartmentStatus();
    },

    // Open HOD Panel
    openPanel() {
        const role = localStorage.getItem('facultypro_user_role');
        if (role !== 'HOD') {
            return UI.showToast('Access Denied: HOD Only');
        }
        
        UI.nav('page-hod-panel');
        this.loadDepartmentStatus();
        this.renderOverview();
    },

    // Load Overview Data
    async loadDepartmentStatus() {
        if (!db) return;
        
        const today = new Date().toLocaleDateString('en-CA');
        
        // Update button state
        const refreshBtn = document.querySelector('button[onclick="HOD.loadDepartmentStatus()"]');
        if (refreshBtn) {
            refreshBtn.textContent = 'Refreshing...';
            refreshBtn.disabled = true;
        }
        
        try {
            // Get all classes
            const tx = db.transaction(['classes', 'attendance'], 'readonly');
            const classStore = tx.objectStore('classes');
            const attStore = tx.objectStore('attendance');
            const attIndex = attStore.index('date');
            
            // Get all classes
            classStore.getAll().onsuccess = e => {
                const classes = e.target.result;
                const statusMap = new Map();
                
                classes.forEach(c => {
                    statusMap.set(c.id, {
                        id: c.id,
                        name: c.name,
                        subjects: [],
                        updated: false
                    });
                });
                
                // Get all attendance for today
                attIndex.getAll(today).onsuccess = ev => {
                    const records = ev.target.result;
                    
                    records.forEach(r => {
                        const s = statusMap.get(r.classId);
                        if (s) {
                            s.updated = true;
                            s.subjects.push({
                                name: r.subject,
                                faculty: r.faculty,
                                count: Object.keys(r.records).length
                            });
                        }
                    });
                    
                    this.todayStatus = Array.from(statusMap.values());
                    this.renderOverview();
                    
                    // Restore button
                    if (refreshBtn) {
                        refreshBtn.textContent = 'REFRESH';
                        refreshBtn.disabled = false;
                    }
                };
            };
            
        } catch (e) {
            console.error('HOD load failed:', e);
            // Restore button on error
            if (refreshBtn) {
                refreshBtn.textContent = 'REFRESH';
                refreshBtn.disabled = false;
            }
        }
    },

    // Render Department Overview
    renderOverview() {
        const container = document.getElementById('hod-overview-list');
        if (!container) return;
        
        if (this.todayStatus.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-6">No classes found</p>';
            return;
        }
        
        container.innerHTML = this.todayStatus.map(cls => `
            <div onclick="HOD.showClassStudents(${cls.id})"
                class="glass-card p-4 rounded-xl border ${cls.updated ? 'border-green-500/30' : 'border-white/5'} cursor-pointer hover:bg-white/5 transition active:scale-[0.99]">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="text-white font-bold text-lg">${cls.name}</h4>
                        <p class="text-xs ${cls.updated ? 'text-green-400' : 'text-gray-500'}">
                            ${cls.updated ? 'Active Today' : 'No Data Today'}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        ${cls.updated ? '<span class="material-symbols-outlined text-green-500">check_circle</span>' : ''}
                        <span class="material-symbols-outlined text-gray-500">chevron_right</span>
                    </div>
                </div>
                
                ${cls.updated ? `
                    <div class="space-y-1 mt-2">
                        ${cls.subjects.map(s => `
                            <div class="flex justify-between text-xs">
                                <span class="text-gray-300">${s.name}</span>
                                <span class="text-gray-500">${s.faculty} (${s.count})</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    // Paste from Clipboard
    async pasteFromClipboard() {
        const token = await TokenUtils.readFromClipboard();
        const textarea = document.getElementById('hod-token-input');
        if (token && textarea) {
            textarea.value = token;
            UI.showToast('Token pasted!');
        }
    },
    
    // Paste token from clipboard
    async pasteFromClipboard() {
        const token = await TokenUtils.readFromClipboard();
        const textarea = document.getElementById('hod-token-input');
        
        if (token && textarea) {
            textarea.value = token;
            UI.showToast('Token pasted!');
        } else {
            UI.showToast('Clipboard empty or access denied');
        }
    },
    
    // Ensure class exists in database (create if missing)
    async ensureClassExists(classId, className) {
        if (!db) return;
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction('classes', 'readwrite');
            const store = tx.objectStore('classes');
            
            // Check if class exists
            store.get(parseInt(classId, 10)).onsuccess = e => {
                if (!e.target.result) {
                    // Class doesn't exist, create it
                    const classRecord = {
                        id: parseInt(classId, 10),
                        name: className,
                        createdAt: Date.now()
                    };
                    store.add(classRecord);
                    console.log(`✅ Auto-created class: ${className}`);
                } else {
                    console.log(`Class ${className} already exists`);
                }
            };
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // 9.2.2: Ensure students exist (auto-create from token data)
    async ensureStudentsExist(classId, students) {
        if (!db || !students || students.length === 0) return;
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction('students', 'readwrite');
            const store = tx.objectStore('students');
            const index = store.index('regNo');
            
            let addedCount = 0;
            let processedCount = 0;
            
            students.forEach(student => {
                // Check if student exists by regNo
                const req = index.get(student.regNo);
                req.onsuccess = e => {
                    processedCount++;
                    if (!e.target.result) {
                        // Student doesn't exist, create it
                        const studentRecord = {
                            classId: parseInt(classId, 10),
                            regNo: student.regNo,
                            name: student.name,
                            createdAt: Date.now()
                        };
                        store.add(studentRecord);
                        addedCount++;
                    }
                    
                    // Check if all processed
                    if (processedCount === students.length && addedCount > 0) {
                        console.log(`✅ Auto-created ${addedCount} students`);
                    }
                };
            });
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // 9.2.1: Check for duplicate imports
    async checkDuplicates(data) {
        if (!db) return [];
        
        return new Promise((resolve) => {
            const tx = db.transaction('attendance', 'readonly');
            const store = tx.objectStore('attendance');
            const index = store.index('classId');
            
            index.getAll(parseInt(data.classId, 10)).onsuccess = e => {
                const records = e.target.result || [];
                
                // Find duplicates (same date + subject)
                const duplicates = [];
                Object.keys(data.subjects || {}).forEach(subject => {
                    const existing = records.find(r => 
                        r.date === data.date && r.subject === subject
                    );
                    if (existing) {
                        duplicates.push(existing);
                    }
                });
                
                resolve(duplicates);
            };
            
            tx.onerror = () => resolve([]);
        });
    },

    // 9.2.3: Save old data to undo buffer before overwrite
    saveToUndoBuffer(records) {
        this.undoBuffer = {
            records: JSON.parse(JSON.stringify(records)), // Deep copy
            timestamp: Date.now()
        };
        console.log('💾 Saved to undo buffer:', records.length, 'records');
    },

    // 9.2.3: Start 1-minute undo timer
    startUndoTimer() {
        // Clear any existing timer
        if (this.undoTimer) {
            clearTimeout(this.undoTimer);
        }
        
        // Set new timer - 60 seconds
        this.undoTimer = setTimeout(() => {
            console.log('⏰ Undo window expired, clearing buffer');
            this.undoBuffer = null;
            this.undoTimer = null;
            this.hideUndoToast();
            UI.showToast('✅ Import finalized');
        }, 60000);
    },

    // 9.2.4: Show floating undo toast
    showUndoToast(count, className) {
        // Remove existing toast
        this.hideUndoToast();
        
        const toastHtml = `
            <div id="undo-toast" class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] 
                    bg-orange-500/95 backdrop-blur-lg px-5 py-4 rounded-2xl 
                    shadow-2xl border border-orange-400/30 max-w-[90%] w-80 animate-fade-in">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-white font-bold text-sm">
                        ✅ Imported ${count} subjects for ${className}
                    </p>
                    <!-- M3 FIX: Add dismiss button -->
                    <button onclick="HOD.dismissUndoToast()" class="text-white/60 hover:text-white -mt-1">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
                <p class="text-white/80 text-xs mb-3">
                    Overwrote existing data. You have 1 minute to undo.
                </p>
                <button onclick="HOD.performUndo()" 
                    class="w-full py-2.5 bg-white/20 border border-white/30 rounded-xl 
                           text-white font-bold text-sm hover:bg-white/30 active:scale-95 transition">
                    ↩️ UNDO IMPORT
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', toastHtml);
    },

    // Hide undo toast
    hideUndoToast() {
        const existingToast = document.getElementById('undo-toast');
        if (existingToast) existingToast.remove();
    },

    // M3 FIX: Dismiss undo toast (keep data, just hide toast)
    dismissUndoToast() {
        this.hideUndoToast();
        // Clear timer but keep buffer (user chose not to undo)
        if (this.undoTimer) {
            clearTimeout(this.undoTimer);
            this.undoTimer = null;
        }
        this.undoBuffer = null;
        UI.showToast('✅ Import confirmed');
    },

    // 9.2.5: Perform undo - restore original data
    async performUndo() {
        // C1 FIX: Add db null check
        if (!db) return UI.showToast('Database error');
        
        if (!this.undoBuffer || !this.undoBuffer.records) {
            return UI.showToast('⚠️ Nothing to undo (timeout expired)');
        }
        
        try {
            const tx = db.transaction('attendance', 'readwrite');
            const store = tx.objectStore('attendance');
            
            // Restore all old records
            this.undoBuffer.records.forEach(record => {
                store.put(record);
            });
            
            await new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            
            // Clear undo state
            this.undoBuffer = null;
            if (this.undoTimer) {
                clearTimeout(this.undoTimer);
                this.undoTimer = null;
            }
            
            // Remove toast
            this.hideUndoToast();
            
            UI.showToast('↩️ Import undone! Old data restored.');
            
            // Refresh view
            this.loadDepartmentStatus();
            
        } catch (e) {
            console.error('Undo failed:', e);
            UI.showToast('❌ Undo failed: ' + e.message);
        }
    },

    // Import Consolidated Report Token
    async importConsolidatedToken() {
        if (!db) throw new Error('Database not available');
        
        const btn = document.querySelector('button[onclick="HOD.importConsolidatedToken()"]');
        const originalText = btn ? btn.innerHTML : '✅ IMPORT REPORT';

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Importing...';
            }
            
            const textarea = document.getElementById('hod-token-input');
            const token = textarea?.value?.trim();
            
            if (!token) throw new Error('Please paste a token first');
            
            if (!window.TokenUtils) throw new Error('Token system error');

            const result = TokenUtils.decode(token);
            if (!result.success) throw new Error('Invalid token: ' + result.error);
            if (result.type !== 'CONSOLIDATED_REPORT') throw new Error('Wrong token type');
            
            const data = result.payload;
            
            // H1 FIX: Validate not empty
            const subjects = data.subjects || {};
            if (Object.keys(subjects).length === 0) {
                throw new Error('Report contains no subjects');
            }
            
            // AUTO-CREATE CLASS if it doesn't exist
            await this.ensureClassExists(data.classId, data.className);
            
            // 9.2.2: AUTO-CREATE STUDENTS from token (if included)
            if (data.students && data.students.length > 0) {
                await this.ensureStudentsExist(data.classId, data.students);
            }
            
            // 9.2.1: CHECK FOR DUPLICATES
            const duplicates = await this.checkDuplicates(data);
            let isOverwrite = false;
            
            if (duplicates.length > 0) {
                const subjectNames = duplicates.map(d => d.subject).join(', ');
                const confirmOverwrite = confirm(
                    `⚠️ Duplicate Found!\n\n` +
                    `Subjects already imported for ${data.className} on ${data.date}:\n` +
                    `${subjectNames}\n\n` +
                    `Overwrite existing data?\n` +
                    `(You'll have 1 minute to UNDO)`
                );
                
                if (!confirmOverwrite) {
                    throw new Error('Import cancelled');
                }
                
                // Save old data to undo buffer BEFORE overwriting
                this.saveToUndoBuffer(duplicates);
                isOverwrite = true;
            }
            
            let count = 0;
            
            for (const [subject, subData] of Object.entries(subjects)) {
                // H1 FIX: Validate subject has records
                // H1 FIX: Validate subject has records
                if (!subData.records || Object.keys(subData.records).length === 0) {
                    console.warn(`Skipping empty subject: ${subject}`);
                    continue;
                }

                // ID MAPPING FIX: Translate Token IDs to RegNos
                const idMap = {};
                if (data.students) {
                    data.students.forEach(s => idMap[s.id] = s.regNo);
                }
                
                const translatedRecords = {};
                for (const [key, value] of Object.entries(subData.records)) {
                    // Try to map key (ID) to RegNo, otherwise keep key
                    const regNo = idMap[key] || key;
                    
                    if (count === 0 && Object.keys(translatedRecords).length < 3) {
                         console.log(`🔍 Mapping ID '${key}' -> RegNo '${regNo}'`);
                    }

                    // NORMALIZE STATUS: Support 0/1 or "Present"/"Absent"
                    let status = value;
                    if (status === 1 || status === '1') status = 'Present';
                    else if (status === 0 || status === '0') status = 'Absent';
                    
                    translatedRecords[regNo] = status;
                }
                
                // Update subData with translated records
                // Clone subData to avoid mutating original
                const newSubData = {...subData, records: translatedRecords};
                
                await this.saveRecord(data.classId, data.date, subject, newSubData);
                count++;
            }
            
            if (count === 0) {
                throw new Error('No valid subjects found in report');
            }
            
            await this.logImport(data);
            
            textarea.value = '';
            
            // Show appropriate feedback
            if (isOverwrite) {
                // Show undo toast for overwrites
                this.showUndoToast(count, data.className);
                this.startUndoTimer();
            } else {
                UI.showToast(`✅ Imported ${count} subjects for ${data.className}`);
            }
            
            // Delay to ensure DB transaction completes before refreshing
            setTimeout(() => {
                this.loadDepartmentStatus();
            }, 500);
            
        } catch (e) {
            UI.showToast(e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    },
    
    async saveRecord(classId, date, subject, data) {
        if (!db) throw new Error('Database not available');
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction('attendance', 'readwrite');
            const store = tx.objectStore('attendance');
            
            const parsedClassId = parseInt(classId, 10);
            
            // Check if record already exists to get its ID for update
            const index = store.index('classId');
            index.getAll(parsedClassId).onsuccess = e => {
                const allClassRecords = e.target.result;
                const existingRecord = allClassRecords.find(r => r.date === date && r.subject === subject);
                
                const record = {
                    classId: parsedClassId,
                    date: date,
                    subject: subject,
                    faculty: data.faculty,
                    timestamp: Date.now(),
                    status: 'consolidated',
                    records: data.records
                };

                if (existingRecord) {
                    record.id = existingRecord.id; // Use existing ID to update
                }
                
                store.put(record);
            };
            
            index.onerror = (e) => {
                console.error('Index query failed:', e);
                reject(index.error);
            };
            
            tx.oncomplete = resolve;
            tx.onerror = e => {
                console.error("Save record transaction failed:", e);
                reject(tx.error);
            };
        });
    },

    // Log import helper
    async logImport(data) {
        try {
            const tx = db.transaction('importLog', 'readwrite');
            const store = tx.objectStore('importLog');
            store.add({
                type: 'CONSOLIDATED',
                classId: data.classId,
                date: data.date,
                mentor: data.mentor,
                subjectCount: Object.keys(data.subjects || {}).length, // Use actual count
                importedAt: Date.now()
            });
        } catch(e) { console.log('Log failed', e); }
    },

    // ===== PHASE 9.3: Student List UI =====
    
    // Current class state for student list
    currentClassId: null,
    currentStudents: [],
    
    // 9.3.2: Show students for a class
    async showClassStudents(classId) {
        if (!db) return UI.showToast('Database not available');
        
        this.currentClassId = classId;
        
        // Get class info
        const cls = window.classes?.find(c => c.id == classId);
        
        // Update header
        const nameEl = document.getElementById('hod-students-class-name');
        const mentorEl = document.getElementById('hod-students-mentor-info');
        
        console.log(`🎓 HOD: Showing students for Class ID ${classId} (${cls?.name})`);

            if (nameEl) nameEl.textContent = cls?.name || 'Class ' + classId;
            
            if (mentorEl) {
                const mentor1 = localStorage.getItem('mentor1_name') || 'Mentor 1'; // ...

            const mentor2 = localStorage.getItem('mentor2_name');
            mentorEl.textContent = mentor2 ? `Mentors: ${mentor1}, ${mentor2}` : `Mentor: ${mentor1}`;
        }
        
        // Navigate to student list page
        UI.nav('page-hod-students');
        
        // NUCLEAR OPTION: Force display block in case CSS fails
        const page = document.getElementById('page-hod-students');
        if (page) {
            page.style.display = 'block';
            page.classList.remove('hidden'); // Double ensure
            console.log('☢️ NUCLEAR: Forced display block on page-hod-students');
        }
        
        // Load students with attendance data
        await this.loadStudentsWithAttendance(classId);
    },
    
    // 9.3.3: Load students and calculate attendance
    async loadStudentsWithAttendance(classId) {
        const listContainer = document.getElementById('hod-students-list');
        
        // C2 FIX: Add db null check
        if (!db) {
            if (listContainer) listContainer.innerHTML = '<div class="text-center text-red-400 py-8">Database not available</div>';
            return;
        }
        
        listContainer.innerHTML = '<div class="text-center text-gray-500 py-8">Loading students...</div>';
        
        try {
            console.log(`⏳ HOD: Fetching students for Class ${classId} from DB...`);
            // Get all students for this class
            const students = await new Promise((resolve, reject) => {
                const tx = db.transaction('students', 'readonly');
                const store = tx.objectStore('students');
                const index = store.index('classId');
                
                index.getAll(IDBKeyRange.only(parseInt(classId, 10))).onsuccess = e => {
                    const result = e.target.result || [];
                    console.log(`✅ HOD: Found ${result.length} students in DB for Class ${classId}`);
                    resolve(result);
                };
                tx.onerror = () => reject(tx.error);
            });
            
            // Get all attendance records for this class
            const records = await new Promise((resolve, reject) => {
                const tx = db.transaction('attendance', 'readonly');
                const store = tx.objectStore('attendance');
                const index = store.index('classId');
                
                index.getAll(IDBKeyRange.only(parseInt(classId, 10))).onsuccess = e => {
                    const res = e.target.result || [];
                    resolve(res);
                };
                tx.onerror = () => reject(tx.error);
            });
            
            // Calculate attendance for each student
            this.currentStudents = students.map(student => {
                const stats = this.calculateStudentAttendance(student, records);
                return {
                    ...student,
                    ...stats
                };
            });
            
            // Default sort: lowest first
            this.sortStudentList('lowest');
            
            // Update count
            const countEl = document.getElementById('hod-students-count');
            if (countEl) {
                const needsAttention = this.currentStudents.filter(s => s.percentage < 75).length;
                countEl.innerHTML = `<span class="text-white font-bold">${students.length}</span> students • <span class="text-red-400">${needsAttention}</span> need attention`;
            }
            
        } catch (e) {
            console.error('Failed to load students:', e);
            listContainer.innerHTML = '<div class="text-center text-red-400 py-8">Failed to load students</div>';
        }
    },
    
    // Calculate attendance percentage for a single student
    calculateStudentAttendance(student, records) {
        if (!student.subjects || Object.keys(student.subjects).length === 0) return 0;
        
        let totalClasses = 0;
        let presentCount = 0;
        
        records.forEach(record => {
        records.forEach(record => {
            // ROBUST LOOKUP STRATEGY: Iterative Scan
            let status = undefined;
            const recKeys = Object.keys(record.records || {});
            
            // Scan keys for match (handles type/trim issues)
            for (const key of recKeys) {
                // Loose equality check + Trigger trimming
                if (key == student.regNo || String(key).trim() === String(student.regNo).trim()) {
                    status = record.records[key];
                    break;
                }
            }
            
            // Fallback for normalized values
            if (status === 0 || status === '0') status = 'Absent';
            if (status === 1 || status === '1') status = 'Present';
            
            if (status) {
                totalClasses++;
                if (status === 'Present') {
                    presentCount++;
                }
            }
        });
        
        // M1 FIX: Return -1 for students with no attendance data (will display "N/A")
        const percentage = totalClasses > 0 
            ? Math.round((presentCount / totalClasses) * 100) 
            : -1;  // -1 indicates no data
        
        return {
            percentage,
            presentCount,
            totalClasses
        };
    },
    
    // 9.3.4 & 9.3.5: Render student list with color coding
    renderStudentList() {
        const container = document.getElementById('hod-students-list');
        if (!container) return;
        
        if (this.currentStudents.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-8">No students found for this class</div>';
            return;
        }
        
        container.innerHTML = this.currentStudents.map(student => {
            // M1 FIX: Handle N/A case for new students
            const hasData = student.percentage >= 0;
            const pct = hasData ? student.percentage : 0;
            
            // Color coding based on percentage
            let colorClass, bgClass;
            if (!hasData) {
                colorClass = 'text-gray-400';
                bgClass = 'bg-gray-500/20 border-gray-500/30';
            } else if (pct < 75) {
                colorClass = 'text-red-400';
                bgClass = 'bg-red-500/20 border-red-500/30';
            } else if (pct < 80) {
                colorClass = 'text-yellow-400';
                bgClass = 'bg-yellow-500/20 border-yellow-500/30';
            } else {
                colorClass = 'text-green-400';
                bgClass = 'bg-green-500/20 border-green-500/30';
            }
            
            return `
                <div onclick="HOD.showStudentDetail(${student.id}, ${this.currentClassId})"
                    class="glass-card p-4 rounded-xl border ${bgClass} cursor-pointer hover:bg-white/5 transition active:scale-[0.99]">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="size-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                                ${student.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <p class="text-white font-medium">${student.name || 'Unknown'}</p>
                                <p class="text-xs text-gray-500">${student.regNo || 'No Reg'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-lg font-bold ${colorClass}">${hasData ? pct + '%' : 'N/A'}</p>
                            <p class="text-xs text-gray-500">${hasData ? student.presentCount + '/' + student.totalClasses : 'No data'}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // 9.3.5: Sort student list
    sortStudentList(sortBy) {
        switch (sortBy) {
            case 'lowest':
                this.currentStudents.sort((a, b) => a.percentage - b.percentage);
                break;
            case 'highest':
                this.currentStudents.sort((a, b) => b.percentage - a.percentage);
                break;
            case 'name':
                this.currentStudents.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'regNo':
                this.currentStudents.sort((a, b) => (a.regNo || '').localeCompare(b.regNo || ''));
                break;
        }
        
        this.renderStudentList();
    },
    
    // 9.4.2: Show student detail modal
    async showStudentDetail(studentId, classId) {
        const student = this.currentStudents.find(s => s.id === studentId);
        if (!student) return UI.showToast('Student not found');
        
        // Store current student for letter generation
        this.currentStudent = student;
        
        // Update modal header
        document.getElementById('hod-detail-avatar').textContent = student.name?.charAt(0) || '?';
        document.getElementById('hod-detail-name').textContent = student.name || 'Unknown';
        document.getElementById('hod-detail-regno').textContent = student.regNo || 'No Reg';
        
        // Update overall percentage
        const overallEl = document.getElementById('hod-detail-overall');
        const statusEl = document.getElementById('hod-detail-status');
        
        overallEl.textContent = student.percentage + '%';
        
        // Color code the percentage
        if (student.percentage < 75) {
            overallEl.className = 'text-4xl font-bold text-red-400';
            statusEl.className = 'px-3 py-1.5 rounded-lg text-sm font-bold bg-red-500/20 text-red-400';
            statusEl.textContent = 'NEEDS ATTENTION';
        } else if (student.percentage < 80) {
            overallEl.className = 'text-4xl font-bold text-yellow-400';
            statusEl.className = 'px-3 py-1.5 rounded-lg text-sm font-bold bg-yellow-500/20 text-yellow-400';
            statusEl.textContent = 'WARNING';
        } else {
            overallEl.className = 'text-4xl font-bold text-green-400';
            statusEl.className = 'px-3 py-1.5 rounded-lg text-sm font-bold bg-green-500/20 text-green-400';
            statusEl.textContent = 'HEALTHY';
        }
        
        // Load and render subject breakdown
        await this.renderSubjectBreakdown(studentId, classId);
        
        // Load and render timeline
        await this.renderAttendanceTimeline(studentId, classId);
        
        // Open modal
        UI.openModal('modal-hod-student-detail');
    },
    
    // 9.4.3: Get and render subject-wise breakdown
    async renderSubjectBreakdown(studentId, classId) {
        const container = document.getElementById('hod-detail-subjects');
        container.innerHTML = '<p class="text-gray-500 text-sm">Loading...</p>';
        
        try {
            // Get all attendance records for this class
            const records = await new Promise((resolve, reject) => {
                const tx = db.transaction('attendance', 'readonly');
                const store = tx.objectStore('attendance');
                const index = store.index('classId');
                
                index.getAll(parseInt(classId, 10)).onsuccess = e => {
                    resolve(e.target.result || []);
                };
                tx.onerror = () => reject(tx.error);
            });
            
            // Group by subject
            const subjectStats = {};
            records.forEach(record => {
                const subject = record.subject;
                const status = record.records?.[studentId];
                
                if (status) {
                    if (!subjectStats[subject]) {
                        subjectStats[subject] = { present: 0, total: 0 };
                    }
                    subjectStats[subject].total++;
                    if (status === 'Present') {
                        subjectStats[subject].present++;
                    }
                }
            });
            
            // Render bars
            if (Object.keys(subjectStats).length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">No attendance data found</p>';
                return;
            }
            
            container.innerHTML = Object.entries(subjectStats).map(([subject, stats]) => {
                const percent = Math.round((stats.present / stats.total) * 100);
                let barColor = 'bg-green-500';
                if (percent < 75) barColor = 'bg-red-500';
                else if (percent < 80) barColor = 'bg-yellow-500';
                
                return `
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-gray-300">${subject}</span>
                            <span class="text-gray-500">${percent}% (${stats.present}/${stats.total})</span>
                        </div>
                        <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div class="${barColor} h-full rounded-full" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (e) {
            console.error('Failed to load subject breakdown:', e);
            container.innerHTML = '<p class="text-red-400 text-sm">Failed to load</p>';
        }
    },
    
    // 9.4.4: Get and render last 10 days timeline
    async renderAttendanceTimeline(studentId, classId) {
        const container = document.getElementById('hod-detail-timeline');
        container.innerHTML = '<p class="text-gray-500 text-sm">Loading...</p>';
        
        try {
            // Get all attendance records
            const records = await new Promise((resolve, reject) => {
                const tx = db.transaction('attendance', 'readonly');
                const store = tx.objectStore('attendance');
                const index = store.index('classId');
                
                index.getAll(parseInt(classId, 10)).onsuccess = e => {
                    resolve(e.target.result || []);
                };
                tx.onerror = () => reject(tx.error);
            });
            
            // Get unique dates and sort (newest first)
            const dateRecords = {};
            records.forEach(record => {
                if (record.records?.[studentId]) {
                    if (!dateRecords[record.date]) {
                        dateRecords[record.date] = [];
                    }
                    dateRecords[record.date].push(record.records[studentId]);
                }
            });
            
            // Sort dates and take last 10
            const sortedDates = Object.keys(dateRecords).sort().reverse().slice(0, 10).reverse();
            
            if (sortedDates.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">No attendance history</p>';
                return;
            }
            
            // Render timeline
            container.innerHTML = sortedDates.map(date => {
                const dayRecords = dateRecords[date];
                // If any class was missed, show as Absent
                const wasAbsent = dayRecords.includes('Absent');
                const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
                
                return `
                    <div class="flex flex-col items-center gap-1">
                        <div class="size-8 rounded-full flex items-center justify-center text-sm font-bold
                            ${wasAbsent ? 'bg-red-500/30 text-red-400' : 'bg-green-500/30 text-green-400'}">
                            ${wasAbsent ? '✗' : '✓'}
                        </div>
                        <span class="text-[10px] text-gray-500">${dayLabel}</span>
                    </div>
                `;
            }).join('');
            
        } catch (e) {
            console.error('Failed to load timeline:', e);
            container.innerHTML = '<p class="text-red-400 text-sm">Failed to load</p>';
        }
    },
    
    // 9.5.1: Generate PDF Intervention Letter
    async generateInterventionLetter() {
        if (!this.currentStudent) {
            return UI.showToast('No student selected');
        }
        
        try {
            UI.showToast('📄 Generating letter...');
            
            if (!window.jspdf) {
                throw new Error('jsPDF library not loaded');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const student = this.currentStudent;
            const classId = this.currentClassId;
            
            // Get class name
            const cls = window.classes?.find(c => c.id == classId);
            const className = cls?.name || 'Class ' + classId;
            
            // Get mentor names
            const mentor1 = localStorage.getItem('mentor1_name') || 'Class Mentor';
            const mentor2 = localStorage.getItem('mentor2_name') || '';
            const hodName = localStorage.getItem('facultyName') || 'Head of Department';
            
            // --- 1. Header with DSU Logo ---
            if (typeof DSU_LOGO_BASE64 !== 'undefined') {
                try {
                    doc.addImage(DSU_LOGO_BASE64, 'PNG', 15, 10, 25, 25);
                } catch(e) {
                    console.warn('Logo add failed:', e);
                }
            }
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(222, 190, 99); // Gold
            doc.text('DHANALAKSHMI SRINIVASAN', 50, 17);
            doc.text('UNIVERSITY', 50, 25);
            
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text('Samayapuram, Tiruchirappalli - 621112', 50, 32);
            
            doc.setLineWidth(0.5);
            doc.setDrawColor(200);
            doc.line(10, 40, 200, 40);
            
            // --- 2. Date & Subject Line ---
            doc.setFont('times', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0);
            
            const today = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
            
            doc.text(`Date: ${today}`, 15, 50);
            doc.text(`To: ${mentor1}${mentor2 ? ', ' + mentor2 : ''} (Class Mentors - ${className})`, 15, 58);
            
            doc.setFont('times', 'bold');
            doc.text('Subject: Student Attendance - Intervention Required', 15, 68);
            
            // --- 3. Body ---
            doc.setFont('times', 'normal');
            doc.setFontSize(11);
            
            let y = 80;
            
            doc.text('Dear Mentor(s),', 15, y);
            y += 10;
            
            const bodyText = `This is to bring to your immediate attention that the following student requires intervention due to low attendance:`;
            const bodyLines = doc.splitTextToSize(bodyText, 175);
            doc.text(bodyLines, 15, y);
            y += bodyLines.length * 6 + 8;
            
            // --- 4. Student Details Box ---
            doc.setFillColor(245, 245, 245);
            doc.rect(15, y, 180, 35, 'F');
            doc.setDrawColor(180);
            doc.rect(15, y, 180, 35, 'S');
            
            y += 8;
            doc.setFont('times', 'bold');
            doc.text('STUDENT DETAILS:', 20, y);
            y += 7;
            
            doc.setFont('times', 'normal');
            doc.text(`Name: ${student.name}`, 20, y);
            doc.text(`Reg. No: ${student.regNo}`, 110, y);
            y += 6;
            doc.text(`Class: ${className}`, 20, y);
            
            doc.setFont('times', 'bold');
            doc.setTextColor(student.percentage < 75 ? 180 : 0, student.percentage < 75 ? 0 : 0, 0);
            doc.text(`Overall Attendance: ${student.percentage}%`, 110, y);
            doc.setTextColor(0);
            
            y += 15;
            
            // --- 5. Subject Breakdown ---
            doc.setFont('times', 'bold');
            doc.text('SUBJECT-WISE BREAKDOWN:', 15, y);
            y += 8;
            
            doc.setFont('times', 'normal');
            
            // Get subject stats (from current data or recalculate)
            const subjectStats = await this.getSubjectStatsForPDF(student.id, classId);
            
            Object.entries(subjectStats).forEach(([subject, stats]) => {
                const percent = Math.round((stats.present / stats.total) * 100);
                // M2 FIX: Use text instead of emoji for PDF compatibility
                const status = percent < 75 ? '(LOW)' : '';
                doc.text(`• ${subject}: ${percent}% (${stats.present}/${stats.total}) ${status}`, 20, y);
                y += 6;
            });
            
            y += 5;
            
            // --- 6. Recommended Actions ---
            doc.setFont('times', 'bold');
            doc.text('RECOMMENDED ACTIONS:', 15, y);
            y += 8;
            
            doc.setFont('times', 'normal');
            const actions = [
                '1. Counsel the student regarding importance of regular attendance',
                '2. Contact parents/guardians if necessary',
                '3. Monitor attendance closely for the next 15 days',
                '4. Submit a progress report to the HOD'
            ];
            
            actions.forEach(action => {
                const lines = doc.splitTextToSize(action, 175);
                doc.text(lines, 20, y);
                y += lines.length * 6;
            });
            
            y += 10;
            
            // --- 7. Signature ---
            doc.text('Regards,', 15, y);
            y += 6;
            doc.setFont('times', 'bold');
            doc.text(hodName, 15, y);
            y += 5;
            doc.setFont('times', 'italic');
            doc.text('Head of Department', 15, y);
            
            // --- 8. Footer ---
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('Generated by FacultyPro • Zinc Labs', 15, 285);
            
            // --- 9. Share/Save PDF ---
            const base64PDF = doc.output('datauristring').split(',')[1];
            const fileName = `Intervention_${student.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            if (typeof Android !== 'undefined' && Android.shareFile) {
                Android.shareFile(base64PDF, fileName, 'application/pdf');
                UI.showToast('📤 Opening share dialog...');
            } else {
                doc.save(fileName);
                UI.showToast('📥 PDF downloaded!');
            }
            
            // Close modal after generating
            UI.closeModal('modal-hod-student-detail');
            
        } catch (e) {
            console.error('PDF generation failed:', e);
            UI.showToast('❌ PDF Error: ' + e.message);
        }
    },
    
    // 9.5.2: Get subject stats for PDF (helper)
    async getSubjectStatsForPDF(studentId, classId) {
        const records = await new Promise((resolve) => {
            const tx = db.transaction('attendance', 'readonly');
            const store = tx.objectStore('attendance');
            const index = store.index('classId');
            
            index.getAll(parseInt(classId, 10)).onsuccess = e => {
                resolve(e.target.result || []);
            };
            index.onerror = () => resolve([]);
        });
        
        const subjectStats = {};
        records.forEach(record => {
            const subject = record.subject;
            const status = record.records?.[studentId];
            
            if (status) {
                if (!subjectStats[subject]) {
                    subjectStats[subject] = { present: 0, total: 0 };
                }
                subjectStats[subject].total++;
                if (status === 'Present') {
                    subjectStats[subject].present++;
                }
            }
        });
        
        return subjectStats;
    }
};

window.HOD = HOD;
console.log('✅ HOD module loaded');
