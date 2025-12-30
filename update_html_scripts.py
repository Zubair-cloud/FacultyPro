import re

# Read the index_modular.html
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\index_modular.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find where to insert the scripts (before </body>)
body_end = content.rfind('</body>')

if body_end == -1:
    print("❌ FAILED: Could not find </body> tag")
    exit(1)

# Create the script tags section
scripts_section = '''
    <!-- ============================================ -->
    <!-- MODULAR JAVASCRIPT - PHASE 2 COMPLETE       -->
    <!-- ============================================ -->
    
    <!-- Load order is critical: config → db → ui → features → init -->
    
    <!-- 1. Core Configuration -->
    <script src="js/core/config.js"></script>
    
    <!-- 2. Database Layer -->
    <script src="js/core/db.js"></script>
    
    <!-- 3. UI Utilities -->
    <script src="js/utils/ui.js"></script>
    
    <!-- 4. Feature Modules -->
    <script src="js/features/classes.js"></script>
    <script src="js/features/students.js"></script>
    <script src="js/features/attendance.js"></script>
    <script src="js/features/export.js"></script>
    
    <!-- 5. App Initialization -->
    <script>
        // --- APP INITIALIZATION ---
        window.onload = async () => {
            console.log('🚀 FacultyPro Modular - Initializing...');
            
            // Set default export dates
            document.getElementById('export-end').valueAsDate = new Date();
            document.getElementById('export-start').valueAsDate = new Date(new Date().setDate(new Date().getDate() - 30));
            
            // Initialize database
            await DB.initDB();
            
            // Load initial data
            loadProfile();
            Classes.loadClasses();
            
            console.log('✅ FacultyPro ready!');
        };
        
        // --- PROFILE FUNCTIONS ---
        function loadProfile() {
            const name = localStorage.getItem('facultyName') || '';
            const phone = localStorage.getItem('facultyPhone') || '';
            const subject = localStorage.getItem('facultySubject') || '';
            
            document.getElementById('set-name').value = name;
            document.getElementById('set-phone').value = phone;
            document.getElementById('set-subject').value = subject;
            document.getElementById('home-greeting').innerText = name || 'Faculty';
        }
        
        function saveProfile() {
            const name = document.getElementById('set-name').value;
            const phone = document.getElementById('set-phone').value;
            const subject = document.getElementById('set-subject').value;
            
            localStorage.setItem('facultyName', name);
            localStorage.setItem('facultyPhone', phone);
            localStorage.setItem('facultySubject', subject);
            
            document.getElementById('home-greeting').innerText = name || 'Faculty';
            UI.showToast('Profile Saved');
        }
        
        // --- UTILITY FUNCTIONS ---
        function triggerRestore() {
            document.getElementById('restore-file').click();
        }
        
        function backupData() {
            const data = {
                classes: Classes.classes,
                timestamp: Date.now()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'facultypro_backup_' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            UI.showToast('Backup Downloaded');
        }
        
        function restoreData(input) {
            const file = input.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    UI.showToast('Restore feature coming soon');
                } catch (err) {
                    UI.showToast('Invalid backup file');
                }
            };
            reader.readAsText(file);
        }
        
        // Confirmation modal functions
        let confirmResolve = null;
        
        function showConfirm(title, message) {
            return new Promise(resolve => {
                confirmResolve = resolve;
                document.getElementById('confirm-title').innerText = title;
                document.getElementById('confirm-message').innerText = message;
                UI.openModal('modal-confirm');
            });
        }
        
        function closeConfirm(result) {
            UI.closeModal('modal-confirm');
            if (confirmResolve) {
                confirmResolve(result);
                confirmResolve = null;
            }
        }
        
        async function wipeData() {
            const confirmed = await showConfirm(
                'Reset Everything?',
                'This will permanently delete all classes, students, and attendance records. This action cannot be undone.'
            );
            
            if (!confirmed) return;
            
            indexedDB.deleteDatabase('FacultyUltimateDB');
            localStorage.clear();
            UI.showToast('Data Wiped - Reloading...');
            setTimeout(() => location.reload(), 1500);
        }
        
        // Expose functions globally
        window.loadProfile = loadProfile;
        window.saveProfile = saveProfile;
        window.triggerRestore = triggerRestore;
        window.backupData = backupData;
        window.restoreData = restoreData;
        window.wipeData = wipeData;
        window.showConfirm = showConfirm;
        window.closeConfirm = closeConfirm;
    </script>
    
'''

# Insert before </body>
new_content = content[:body_end] + scripts_section + '\n' + content[body_end:]

# Write back
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\index_modular.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ SUCCESS: Updated index_modular.html with all script tags")
print("   Load order: config → db → ui → features → init")
print("   Total modules: 7 JS files + initialization script")
