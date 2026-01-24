"""
Inject missing Phase 9 HOD Student features into index_modular.html
"""

# Read files
with open('app/src/main/assets/index_modular.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('app/src/main/assets/pages/hod-students.html', 'r', encoding='utf-8') as f:
    students_page = f.read()

# HOD Student Detail Modal
student_modal = '''
    <!-- HOD Student Detail Modal (Phase 9.4) -->
    <div id="modal-hod-student-detail"
        class="modal-overlay fixed inset-0 z-[70] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="modal-content w-full max-w-sm rounded-2xl glass-card border border-white/10 bg-[#1a1f2c] max-h-[90vh] overflow-y-auto">
            
            <!-- Header -->
            <div class="p-5 border-b border-white/10 bg-white/5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div id="hod-detail-avatar" 
                            class="size-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                            A
                        </div>
                        <div>
                            <h3 id="hod-detail-name" class="text-white font-bold text-lg">Student Name</h3>
                            <p id="hod-detail-regno" class="text-sm text-gray-400">REG001</p>
                        </div>
                    </div>
                    <button onclick="UI.closeModal('modal-hod-student-detail')"
                        class="size-8 rounded-full bg-white/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-gray-400 text-lg">close</span>
                    </button>
                </div>
            </div>
            
            <!-- Overall Attendance -->
            <div class="p-5 border-b border-white/10">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-xs mb-1">Overall Attendance</p>
                        <p id="hod-detail-overall" class="text-4xl font-bold text-white">85%</p>
                    </div>
                    <div id="hod-detail-status" 
                        class="px-3 py-1.5 rounded-lg text-sm font-bold bg-green-500/20 text-green-400">
                        HEALTHY
                    </div>
                </div>
            </div>
            
            <!-- Subject Breakdown -->
            <div class="p-5 border-b border-white/10">
                <h4 class="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <span class="material-symbols-outlined text-purple-400">bar_chart</span>
                    Subject Breakdown
                </h4>
                <div id="hod-detail-subjects" class="space-y-3">
                    <!-- Subject bars rendered here -->
                </div>
            </div>
            
            <!-- Last 10 Days Timeline -->
            <div class="p-5 border-b border-white/10">
                <h4 class="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <span class="material-symbols-outlined text-blue-400">calendar_month</span>
                    Last 10 Days
                </h4>
                <div id="hod-detail-timeline" class="flex gap-1 flex-wrap">
                    <!-- Timeline dots rendered here -->
                </div>
            </div>
            
            <!-- Action Button -->
            <div class="p-5">
                <button onclick="HOD.generateInterventionLetter()"
                    class="w-full py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition">
                    <span class="material-symbols-outlined">picture_as_pdf</span>
                    Generate Intervention Letter
                </button>
            </div>
        </div>
    </div>
'''

# Find insertion point - before the toast element
insert_marker = '<div id="toast"'
if insert_marker in html:
    parts = html.split(insert_marker, 1)
    html = parts[0] + '\n    ' + students_page + '\n' + student_modal + '\n    ' + insert_marker + parts[1]
    print("SUCCESS: Injected HOD Students page and modal")
else:
    print("ERROR: Could not find insertion point")
    exit(1)

# Write back
with open('app/src/main/assets/index_modular.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"index_modular.html now has {html.count(chr(10))} lines")
