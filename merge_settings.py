"""
Merge settings.html back into index.html to fix License initialization
"""

import re

# Read the files
with open('app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

with open('app/src/main/assets/pages/settings.html', 'r', encoding='utf-8') as f:
    settings_content = f.read()

# Find the insertion point (before page-container)
insertion_marker = '<!-- Dynamic Page Container'

if insertion_marker in index_content:
    # Split index at the marker
    before, after = index_content.split(insertion_marker, 1)
    
    # Insert settings content
    new_content = before + '\n        <!-- SETTINGS PAGE (Kept inline for License UI) -->\n        ' + settings_content + '\n\n        ' + insertion_marker + after
    
    # Write back
    with open('app/src/main/assets/index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("SUCCESS: Merged settings.html into index.html")
    print(f"   Index.html now: {new_content.count(chr(10))} lines")
else:
    print("ERROR: Could not find insertion marker")
