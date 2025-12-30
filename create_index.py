import sys

# Read the original attendance.html  
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find where <body> starts and where first <script> after body starts
body_start = None
script_start = None

for i, line in enumerate(lines):
    if '<body>' in line:
        body_start = i
    if body_start and '<script>' in line and 'STATE VARIABLES' in lines[i+1] if i+1 < len(lines) else False:
        script_start = i
        break

if not body_start:
    print("❌ FAILED: Could not find <body> tag")
    sys.exit(1)

# Extract body content (from <body> to before first <script>)
if script_start:
    body_content = ''.join(lines[body_start:script_start])
else:
    # If can't find script, take everything from body to near end
    body_content = ''.join(lines[body_start:-10])  # Leave out last few lines

# Create modular index.html
index_content = '''<!DOCTYPE html>
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

    <!-- Tailwind Configuration (Extracted) -->
    <script src="css/tailwind.config.js"></script>

    <!-- App Styles (Extracted) -->
    <link rel="stylesheet" href="css/app.css">
</head>

''' + body_content + '''
    <!-- ============================================ -->
    <!-- JAVASCRIPT - TO BE MODULARIZED IN PHASE 2   -->
    <!-- ============================================ -->
    
    <!-- Placeholder for modular JavaScript -->
    <!-- Phase 2 will extract JS to separate files -->
    
</body>
</html>'''

# Write modular index.html
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\index_modular.html', 'w', encoding='utf-8') as f:
    f.write(index_content)

print("✅ SUCCESS: Created index_modular.html")
print(f"   Body content: {len(body_content)} characters")
print("   CSS linked: css/app.css")
print("   Tailwind linked: css/tailwind.config.js")
print("   Original attendance.html: UNTOUCHED")
print("\n📝 Next: Phase 2 will extract JavaScript to separate files")
