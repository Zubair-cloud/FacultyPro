import re

# Read attendance.html
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the database initialization code (lines ~670-778)
# Find initDB, getAll, getLog functions
db_functions_pattern = r'(let db;.*?(?=// --- 5\. CLASS MANAGEMENT))'
db_match = re.search(db_functions_pattern, content, re.DOTALL)

if db_match:
    db_code = db_match.group(1).strip()
    
    # Create db.js with proper module structure
    db_js = '''// FacultyPro - Database Layer (IndexedDB)
// Extracted from attendance.html for modular architecture

let db;

''' + db_code.replace('let db;', '').strip() + '''

// Export to global scope
window.DB = {
    initDB,
    getAll,
    getLog
};

console.log('✅ Database module loaded');
'''
    
    # Write to db.js
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\js\core\db.js', 'w', encoding='utf-8') as f:
        f.write(db_js)
    
    print("✅ SUCCESS: Extracted database functions to js/core/db.js")
    print(f"   Size: {len(db_code)} characters")
else:
    print("❌ FAILED: Could not find database functions")
