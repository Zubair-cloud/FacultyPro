import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 14: Update toggleStd() to prevent edits in history mode

old_toggle = r'''function toggleStd\(id, locked\) \{
            if \(locked\) return showToast\(\"Attendance Locked\"\);
            const curr = tempAttendance\[id\];
            const next = curr === 'Present' \? 'Absent' : 'Present';
            tempAttendance\[id\] = next;
            const btn = document\.getElementById\(`btn-\$\{id\}`\);
            if \(next === 'Present'\) \{ btn\.className = \"h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 bg-green-500/20 text-green-400 border-green-500/30\"; btn\.innerText = \"PRESENT\"; \}
            else \{ btn\.className = \"h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 bg-red-500/20 text-red-400 border-red-500/30\"; btn\.innerText = \"ABSENT\"; \}
        \}'''

new_toggle = '''function toggleStd(id, locked) {
            // Prevent any changes in history mode
            if (viewMode === 'history') return showToast("History is Read-Only");
            if (locked) return showToast("Attendance Locked");
            
            const curr = tempAttendance[id];
            const next = curr === 'Present' ? 'Absent' : 'Present';
            tempAttendance[id] = next;
            const btn = document.getElementById(`btn-${id}`);
            if (next === 'Present') { btn.className = "h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 bg-green-500/20 text-green-400 border-green-500/30"; btn.innerText = "PRESENT"; }
            else { btn.className = "h-10 px-4 rounded-lg border font-bold text-sm transition-all duration-300 bg-red-500/20 text-red-400 border-red-500/30"; btn.innerText = "ABSENT"; }
        }'''

new_content = re.sub(old_toggle, new_toggle, content, flags=re.MULTILINE)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Updated toggleStd() function")
    print("  - Added viewMode check at the start")
    print("  - Shows 'History is Read-Only' toast in history mode")
    print("  - Prevents any attendance changes when viewing history")
else:
    print("❌ FAILED: Could not find toggleStd function")
    sys.exit(1)
