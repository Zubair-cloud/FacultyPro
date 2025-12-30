import re

# Read the original attendance.html
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the <style> block (lines 43-193 approximately)
style_pattern = r'<style>(.*?)</style>'
style_match = re.search(style_pattern, content, re.DOTALL)

if style_match:
    css_content = style_match.group(1).strip()
    
    # Write to app.css
    with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\css\app.css', 'w', encoding='utf-8') as f:
        f.write("""/* FacultyPro - Core Application Styles */
/* Extracted from attendance.html for modular architecture */

""")
        f.write(css_content)
    
    print("✅ SUCCESS: Extracted CSS to app.css")
    print(f"   Size: {len(css_content)} characters")
else:
    print("❌ FAILED: Could not find <style> tag")
