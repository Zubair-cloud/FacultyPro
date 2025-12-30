import re
import sys

# Read the HTML file
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 4: Update History "View Record" button (line 264)
# Change onclick="goToHistory('view')" to onclick="goToHistoryView()"
content = re.sub(
    r'onclick="goToHistory\(\'view\'\)"',
    r'onclick="goToHistoryView()"',
    content
)

# Step 5: Update Backlog "Add Attendance" button (line 280)
# Change onclick="goToHistory('add')" to onclick="goToBacklogAdd()"
content = re.sub(
    r'onclick="goToHistory\(\'add\'\)"',
    r'onclick="goToBacklogAdd()"',
    content
)

# Write back
with open(r'c:\Users\Shaik\AndroidStudioProjects\FacultyPro\app\src\main\assets\attendance.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ SUCCESS: Updated button onclick handlers")
print("  - History 'View Record' button now calls goToHistoryView()")
print("  - Backlog 'Add Attendance' button now calls goToBacklogAdd()")
