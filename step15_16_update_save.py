import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Steps 15 & 16: Update saveAttendance to validate viewMode and disable late entry timer for non-today dates

old_save = r'''function saveAttendance\(mode\) \{
            if \(!activeClass\) return;
            const record = \{ classId: activeClass\.id, date: currentAttendanceDate, timestamp: Date\.now\(\), status: mode, records: tempAttendance \};
            const tx = db\.transaction\('attendance', 'readwrite'\);
            const store = tx\.objectStore\('attendance'\);
            const idx = store\.index\('classId'\);
            idx\.getAll\(activeClass\.id\)\.onsuccess = e => \{
                const all = e\.target\.result;
                const exist = all\.find\(x => x\.date === record\.date\);
                if \(exist\) record\.id = exist\.id;
                store\.put\(record\);
                tx\.oncomplete = \(\) => \{
                    showToast\(mode === 'final' \? \"Locked & Saved\" : \"Late Entry Active\"\);
                    if \(mode === 'draft'\) startLateEntryTimer\(\);
                    else stopLateEntryTimer\(\);
                \};
            \};
        \}'''

new_save = '''function saveAttendance(mode) {
            // Prevent saving in history mode
            if (viewMode === 'history') {
                return showToast("Cannot save in history view");
            }
            
            if (!activeClass) return;
            const record = { classId: activeClass.id, date: currentAttendanceDate, timestamp: Date.now(), status: mode, records: tempAttendance };
            const tx = db.transaction('attendance', 'readwrite');
            const store = tx.objectStore('attendance');
            const idx = store.index('classId');
            idx.getAll(activeClass.id).onsuccess = e => {
                const all = e.target.result;
                const exist = all.find(x => x.date === record.date);
                if (exist) record.id = exist.id;
                store.put(record);
                tx.oncomplete = () => {
                    showToast(mode === 'final' ? "Locked & Saved" : "Late Entry Active");
                    
                    // Only start late entry timer if:
                    // 1. Mode is draft
                    // 2. Date is today (not a historical date)
                    const today = new Date().toLocaleDateString('en-CA');
                    if (mode === 'draft' && currentAttendanceDate === today) {
                        startLateEntryTimer();
                    } else {
                        stopLateEntryTimer();
                    }
                };
            };
        }'''

new_content = re.sub(old_save, new_save, content, flags=re.MULTILINE)

# Verify change was made
if new_content != content:
    # Write back
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ SUCCESS: Updated saveAttendance() function")
    print("  - Added viewMode check to prevent saving in history mode")
    print("  - Late entry timer only starts if date is today")
    print("  - Historical dates won't trigger late entry timer")
else:
    print("❌ FAILED: Could not find saveAttendance function")
    sys.exit(1)
