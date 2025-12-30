import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 11, 12, 13: Update renderAttendanceList function
# This is a complex change - we need to:
# 1. Check if in history mode with no records -> show message
# 2. Make buttons disabled/styled differently in history mode

old_function = r'''function renderAttendanceList\(savedRecords, isLocked\) \{
            const list = document\.getElementById\('att-student-list'\);
            list\.innerHTML = ''; tempAttendance = \{\};
            if \(currentStudents\.length === 0\) \{ list\.innerHTML = `<div class="text-center text-gray-500 py-10 col-span-full">No students found\.</div>`; return; \}
            currentStudents\.forEach\(s => \{
                let status = 'Present';
                if \(savedRecords && savedRecords\[s\.id\]\) status = savedRecords\[s\.id\];
                tempAttendance\[s\.id\] = status;
                const div = document\.createElement\('div'\);
                div\.className = 'glass-card p-3 rounded-xl flex justify-between items-center transition-all duration-300';
                const btnClass = status === 'Present' \? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
                div\.innerHTML = `<div class="flex items-center gap-3"><div class="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 font-bold text-sm border border-white/10">\$\{s\.regNo\.slice\(-2\)\}</div><div><p class="text-white font-semibold text-sm">\$\{s\.name\}</p><p class="text-xs text-gray-500">\$\{s\.regNo\}</p></div></div><button id="btn-\$\{s\.id\}" onclick="toggleStd\(\$\{s\.id\}, \$\{isLocked\}\)" class="h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 \$\{btnClass\}">\$\{status === 'Present' \? 'PRESENT' : 'ABSENT'\}</button>`;
                list\.appendChild\(div\);
            \}\);
        \}'''

new_function = '''function renderAttendanceList(savedRecords, isLocked) {
            const list = document.getElementById('att-student-list');
            list.innerHTML = ''; tempAttendance = {};
            
            // Check if in history mode with no records
            if (viewMode === 'history' && !savedRecords) {
                list.innerHTML = `<div class="col-span-full text-center py-16">
                    <div class="glass-card p-8 rounded-2xl max-w-md mx-auto">
                        <span class="material-symbols-outlined text-6xl text-gray-600 mb-4 block">event_busy</span>
                        <p class="text-white text-lg font-bold mb-2">No Attendance Recorded</p>
                        <p class="text-gray-400 text-sm">Attendance was not taken for this date. Use the Backlog feature to add it.</p>
                    </div>
                </div>`;
                return;
            }
            
            if (currentStudents.length === 0) { 
                list.innerHTML = `<div class="text-center text-gray-500 py-10 col-span-full">No students found.</div>`; 
                return; 
            }
            
            currentStudents.forEach(s => {
                let status = 'Present';
                if (savedRecords && savedRecords[s.id]) status = savedRecords[s.id];
                tempAttendance[s.id] = status;
                const div = document.createElement('div');
                div.className = 'glass-card p-3 rounded-xl flex justify-between items-center transition-all duration-300';
                
                // Determine button styling based on viewMode
                let btnClass = status === 'Present' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
                let btnDisabled = '';
                let btnCursor = '';
                
                if (viewMode === 'history') {
                    btnClass += ' opacity-60 cursor-not-allowed';
                    btnDisabled = 'disabled';
                    btnCursor = 'style="pointer-events: none;"';
                }
                
                div.innerHTML = `<div class="flex items-center gap-3"><div class="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 font-bold text-sm border border-white/10">\${s.regNo.slice(-2)}</div><div><p class="text-white font-semibold text-sm">\${s.name}</p><p class="text-xs text-gray-500">\${s.regNo}</p></div></div><button id="btn-\${s.id}" onclick="toggleStd(\${s.id}, \${isLocked})" class="h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 \${btnClass}" \${btnDisabled} \${btnCursor}>\${status === 'Present' ? 'PRESENT' : 'ABSENT'}</button>`;
                list.appendChild(div);
            });
        }'''

new_content = re.sub(old_function, new_function, content, flags=re.MULTILINE)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Updated renderAttendanceList() function")
    print("Changes:")
    print("  - Show 'No Attendance Recorded' message in history mode with no data")
    print("  - Disable buttons visually in history mode (opacity + cursor)")
    print("  - Prevent clicks with disabled attribute and pointer-events: none")
else:
    print("❌ FAILED: Could not find renderAttendanceList function")
    sys.exit(1)
