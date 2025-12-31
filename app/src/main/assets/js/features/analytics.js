// FacultyPro - Analytics & Intervention Core
// "The Brain" of the system. Handles logic, math, and categorization.

const Analytics = {
    // Configurable Thresholds (Can be changed via Settings later)
    thresholds: {
        danger: 75,      // Below 75% = Defaulter (Red)
        warning: 85,     // 75-85% = At Risk (Orange)
        star: 90         // Above 90% = Star Performer (Gold)
    },

    // State to hold calculated data
    currentClassStats: {
        classId: null,
        totalClasses: 0,
        avgAttendance: 0,
        students: [] // [{id, name, regNo, presentCount, totalCount, percentage, status}]
    },

    /**
     * ✅ LEVEL 1: Calculate Statistics for a whole class
     * Iterates through ALL attendance records for a class and computes % for each student.
     */
    async calculateClassStats(classId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("Database not initialized");

            const tx = db.transaction(['attendance', 'students'], 'readonly');
            const attStore = tx.objectStore('attendance');
            const stdStore = tx.objectStore('students');
            const attIndex = attStore.index('classId');
            const stdIndex = stdStore.index('classId');

            let students = [];
            let attendanceRecords = [];

            // 1. Get All Students
            const stdReq = stdIndex.getAll(classId);
            stdReq.onsuccess = (e) => {
                try {
                students = e.target.result;
                console.log(`[Analytics] Found ${students.length} students for class ${classId}`);

                // 2. Get All Attendance Records
                const attReq = attIndex.getAll(classId);
                attReq.onsuccess = (ae) => {
                    try {
                        attendanceRecords = ae.target.result;
                        console.log(`[Analytics] Found ${attendanceRecords.length} attendance records`);
                        
                        // 3. Process Data
                        const stats = this._computeStats(students, attendanceRecords);
                        this.currentClassStats = stats;
                        console.log(`[Analytics] Stats calculated`, stats);
                        resolve(stats);
                    } catch (err) {
                        console.error('[Analytics] Error processing data:', err);
                        reject(err);
                    }
                };
                attReq.onerror = (ae) => reject("Attendance query failed");

                } catch (err) {
                    console.error('[Analytics] Error fetching students:', err);
                    reject(err);
                }
            };
            stdReq.onerror = (e) => reject("Student query failed");
        });
    },

    /**
     * 🧠 Internal Math Engine
     * Calculates percentage and assigns status buckets.
     */
    _computeStats(students, records) {
        const totalSessions = records.length;
        if (totalSessions === 0) return this._emptyStats(students);

        let classTotalPercent = 0;

        const processedStudents = students.map(std => {
            // Count how many times this student was 'Present'
            let presentCount = 0;
            records.forEach(session => {
                if (session.records && session.records[std.id] === 'Present') {
                    presentCount++;
                }
            });

            // Calculate Percentage
            const percentage = ((presentCount / totalSessions) * 100).toFixed(1);
            
            // Bucket Logic
            let status = 'Good'; 
            if (percentage < this.thresholds.danger) status = 'Danger';
            else if (percentage >= this.thresholds.star) status = 'Star';
            else if (percentage < this.thresholds.warning) status = 'Warning';

            classTotalPercent += parseFloat(percentage);

            return {
                id: std.id,
                name: std.name,
                regNo: std.regNo,
                presentCount,
                totalCount: totalSessions,
                percentage: parseFloat(percentage), // Keep as number for sorting
                status: status
            };
        });

        // Sort: Danger First, then Low to High
        processedStudents.sort((a, b) => a.percentage - b.percentage);

        return {
            classId: students[0]?.classId,
            totalClasses: totalSessions,
            avgAttendance: students.length ? (classTotalPercent / students.length).toFixed(1) : "0.0",
            students: processedStudents
        };
    },

    _emptyStats(students) {
        return {
            classId: students[0]?.classId,
            totalClasses: 0,
            avgAttendance: 0,
            students: students.map(s => ({ ...s, percentage: 0, status: 'Danger' }))
        };
    },

    /**
     * ✅ LEVEL 2: Get Detailed History for ONE Student (Drill-down)
     * Used for the "Student Profile" view + Sparkline Graph.
     */
    async getStudentHistory(classId, studentId) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('attendance', 'readonly');
            const index = tx.objectStore('attendance').index('classId');
            
            index.getAll(classId).onsuccess = (e) => {
                const records = e.target.result;
                
                // Map to simple timeline: [{date: '2023-01-01', status: 'Present', trend: 85}]
                let cumulativePresent = 0;
                let cumulativeTotal = 0;

                const history = records.map(record => {
                    const status = record.records[studentId] || 'Absent';
                    
                    cumulativeTotal++;
                    if (status === 'Present') cumulativePresent++;
                    
                    const currentTrend = ((cumulativePresent / cumulativeTotal) * 100).toFixed(1);

                    return {
                        date: record.date,
                        timestamp: record.timestamp,
                        status: status,
                        trend: parseFloat(currentTrend)
                    };
                });

                // Sort by date just in case
                history.sort((a, b) => a.timestamp - b.timestamp);
                resolve(history);
            };
        });
    },

    // Get counts for dashboard buckets
    getBucketCounts() {
        const s = this.currentClassStats.students;
        return {
            danger: s.filter(x => x.status === 'Danger').length,
            warning: s.filter(x => x.status === 'Warning').length,
            star: s.filter(x => x.status === 'Star').length,
            good: s.filter(x => x.status === 'Good').length
        };
    },

    // ==========================================
    // UI RENDERING LOGIC (Phase 2)
    // ==========================================

    activeTab: 'danger', // 'danger', 'warning', 'star'

    // Load Data & Render
    async loadClassData() {
        const select = document.getElementById('analytics-class-select');
        const classId = select.value;
        
        if (!classId) {
            UI.showToast("Please select a class first");
            return;
        }

        try {
            // 1. Calculate Stats
            const stats = await this.calculateClassStats(parseInt(classId));
            
            // 2. Update Dashboard
            document.getElementById('analytics-empty').classList.add('hidden');
            document.getElementById('analytics-hero').classList.remove('hidden');
            document.getElementById('analytics-hero').classList.add('flex');
            
            // 3. Render Hero Stats
            document.getElementById('analytics-avg-percent').innerText = stats.avgAttendance + '%';
            
            // 4. Update Badge Counts
            const counts = this.getBucketCounts();
            document.getElementById('count-danger').innerText = counts.danger;
            document.getElementById('count-warning').innerText = counts.warning;
            document.getElementById('count-star').innerText = counts.star;

            // 5. Render List (Default Tab)
            this.switchTab(this.activeTab);

        } catch (e) {
            console.error(e);
            UI.showToast("Error: " + (e.message || e));
        }
    },

    // Switch Bucket Tabs
    switchTab(tab) {
        this.activeTab = tab;
        
        // visual toggle
        ['danger', 'warning', 'star'].forEach(t => {
            const btn = document.getElementById(`tab-${t}`);
            if (t === tab) {
                btn.style.opacity = '1';
                btn.style.borderColor = this._getTabColor(t, true);
            } else {
                btn.style.opacity = '0.5';
                btn.style.borderColor = 'transparent';
            }
        });

        this.renderStudentList();
    },

    _getTabColor(tab, isBorder) {
        if (tab === 'danger') return isBorder ? 'rgba(239, 68, 68, 0.5)' : '#EF4444'; // Red
        if (tab === 'warning') return isBorder ? 'rgba(249, 115, 22, 0.5)' : '#F97316'; // Orange
        if (tab === 'star') return isBorder ? 'rgba(222, 190, 99, 0.5)' : '#DEBE63'; // Gold
        return '#fff';
    },

    renderStudentList() {
        const container = document.getElementById('analytics-student-list');
        container.innerHTML = '';

        const students = this.currentClassStats.students.filter(s => {
            if (this.activeTab === 'danger') return s.status === 'Danger';
            if (this.activeTab === 'warning') return s.status === 'Warning';
            if (this.activeTab === 'star') return s.status === 'Star';
            return false; 
        });

        if (students.length === 0) {
            container.innerHTML = `<div class="text-center p-4 text-gray-500 text-xs">No students in this category</div>`;
            return;
        }

        students.forEach(s => {
            const div = document.createElement('div');
            // Glassmorphism Card with colored left border
            const borderColor = this._getTabColor(this.activeTab, false);
            
            div.className = `glass-card p-3 rounded-xl flex justify-between items-center border-l-4`;
            div.style.borderLeftColor = borderColor;
            
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 text-xs font-bold">
                        ${s.regNo.slice(-2)}
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${s.name}</p>
                        <p class="text-gray-500 text-[10px] uppercase tracking-wider">${s.presentCount}/${s.totalCount} Sessions</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold" style="color: ${borderColor}">${s.percentage}%</p>
                    <button onclick="Analytics.showStudentProfile(${s.id})" class="text-[10px] text-gray-400 underline h-6">View</button>
                </div>
            `;
            container.appendChild(div);
        });
    },

    // Open Student Profile Modal
    async showStudentProfile(studentId) {
        const student = this.currentClassStats.students.find(s => s.id === studentId);
        if (!student) return;

        // 1. Populate Basic Info
        document.getElementById('anl-profile-name').innerText = student.name;
        document.getElementById('anl-profile-reg').innerText = student.regNo;
        document.getElementById('anl-profile-initial').innerText = student.name.charAt(0);
        document.getElementById('anl-profile-percent').innerText = student.percentage + '%';
        document.getElementById('anl-profile-sessions').innerText = `${student.presentCount}/${student.totalCount}`;

        // Color code the avatar ring
        const borderColor = this._getTabColor(student.status.toLowerCase(), false);
        document.getElementById('anl-profile-avatar').style.background = `linear-gradient(135deg, ${borderColor}, #000)`;
        document.getElementById('anl-profile-percent').style.color = borderColor;

        // 2. Fetch & Render History
        const classId = this.currentClassStats.classId;
        const history = await this.getStudentHistory(classId, studentId);
        
        this.renderHistoryList(history);
        this.renderSparkline(history, borderColor);

        // 3. Open Modal
        UI.openModal('modal-analytics-profile');
    },

    renderHistoryList(history) {
        const list = document.getElementById('anl-history-list');
        list.innerHTML = '';
        
        // Take last 5 records
        history.slice(-5).reverse().forEach(h => {
             const isPresent = h.status === 'Present';
             const icon = isPresent ? 'check_circle' : 'cancel';
             const color = isPresent ? 'text-green-400' : 'text-red-400';
             
             const div = document.createElement('div');
             div.className = `flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5`;
             div.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined ${color} text-lg">${icon}</span>
                    <span class="text-sm text-gray-300 font-medium">${h.date}</span>
                </div>
                <span class="text-xs text-gray-500 font-mono">${h.trend}%</span>
             `;
             list.appendChild(div);
        });
    },

    renderSparkline(history, color) {
        const container = document.getElementById('anl-sparkline-container');
        if (history.length < 2) {
             container.innerHTML = '<p class="text-[10px] text-gray-600 w-full text-center">Not enough data</p>';
             return;
        }

        // SVG Logic
        const w = container.clientWidth || 300;
        const h = container.clientHeight || 100;
        const pts = history.map((d, i) => {
            const x = (i / (history.length - 1)) * w;
            const y = h - ((d.trend / 100) * h);
            return `${x},${y}`;
        }).join(' ');

        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.5" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0" />
                    </linearGradient>
                </defs>
                <path d="M0,${h} ${pts} L${w},${h}" fill="url(#grad)" stroke="none" />
                <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" />
            </svg>
        `;
    },

    openIntervention() {
        UI.showToast("Intervention Engine (Coming Soon!) ⚡");
    }

};

// Export Logic
window.Analytics = Analytics;
console.log('✅ Analytics Core Module Loaded');
