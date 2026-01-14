# Deploy to Device 1
Write-Host "`n=== Device 1: RZ8M42ZMH5A ===" -ForegroundColor Cyan
adb -s RZ8M42ZMH5A uninstall com.zinclabs.facultypro 2>$null
adb -s RZ8M42ZMH5A install app\build\outputs\apk\debug\app-debug.apk

# Deploy to Device 2
Write-Host "`n=== Device 2: 3C15C6005LD00000 ===" -ForegroundColor Cyan
adb -s 3C15C6005LD00000 uninstall com.zinclabs.facultypro 2>$null
adb -s 3C15C6005LD00000 install app\build\outputs\apk\debug\app-debug.apk

# Deploy to Device 3
Write-Host "`n=== Device 3: 9628749279000FY ===" -ForegroundColor Cyan
adb -s 9628749279000FY uninstall com.zinclabs.facultypro 2>$null
adb -s 9628749279000FY install app\build\outputs\apk\debug\app-debug.apk

Write-Host "`n✅ All devices updated!" -ForegroundColor Green
