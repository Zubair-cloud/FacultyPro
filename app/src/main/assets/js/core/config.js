// FacultyPro - Core Configuration
// Extracted from attendance.html for modular architecture

const APP_CONFIG = {
    version: 'v24',
    name: 'Faculty Pro',
    
    // Database
    dbName: 'FacultyUltimateDB',
    dbVersion: 4,
    
    // Features (will be controlled by license in future)
    features: {
        attendance: true,
        studentManagement: true,
        export: true,
        analytics: false,  // Premium feature
        cloudSync: false   // Premium feature
    },
    
    // UI Settings
    theme: {
        primaryColor: '#4A90E2',
        primaryDark: '#2E5BFF',
        accentColor: '#D0021B'
    },
    
    // Late Entry Timer (in seconds)
    lateEntryDuration: 15 * 60, // 15 minutes
    
    // Institution (set after license validation)
    institution: null
};

// Export to global scope
window.APP_CONFIG = APP_CONFIG;

console.log(`✅ ${APP_CONFIG.name} ${APP_CONFIG.version} - Config loaded`);
