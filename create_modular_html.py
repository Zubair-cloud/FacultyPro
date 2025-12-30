import re

# Read attendance.html to get the HTML structure
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract just the body HTML (lines 158-620 approximately - before the JavaScript)
# We'll get everything from <body> to the start of main <script>
body_pattern = r'(<body>.*?)(?=<script>.*?//.*?1\. STATE VARIABLES)'
body_match = re.search(body_pattern, content, re.DOTALL)

if body_match:
    body_html = body_match.group(1).strip()
    
    # Create modular index.html
    index_html = '''<!DOCTYPE html>
<html lang="en" class="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Faculty Pro - Modular</title>

    <!-- External Dependencies -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>

    <!-- Tailwind Configuration -->
    <script src="css/tailwind.config.js"></script>

    <!-- App Styles -->
    <link rel="stylesheet" href="css/app.css">
</head>

''' + body_html + '''

    <!-- Core JavaScript (will be extracted in Phase 2) -->
    <script>
        // Placeholder - All JS from attendance.html will be extracted to separate files in Phase 2
        console.log("Modular structure ready - JS extraction pending");
        
        // Temporary: Load all JS from original attendance.html for now
        // This will be replaced with modular JS files in Phase 2
    </script>
    
    <!-- Temporary: Include original JS until Phase 2 -->
    <script>
        // TODO Phase 2: Extract to:
        // - js/core/config.js
        // - js/core/db.js
        // - js/features/attendance.js
        // - js/features/classes.js
        // - js/features/students.js
        // - js/utils/ui.js
    </script>

</body>
</html>'''
    
    # Write to index.html
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\index.html', 'w', encoding='utf-8') as f:
        f.write(index_html)
    
    print("✅ SUCCESS: Created modular index.html")
    print(f"   Body HTML size: {len(body_html)} characters")
    print("   CSS: Linked to css/app.css ✅")
    print("   Tailwind config: Linked to css/tailwind.config.js ✅")
    print("   JS: Placeholder ready for Phase 2 extraction")
else:
    print("❌ FAILED: Could not extract body HTML")
