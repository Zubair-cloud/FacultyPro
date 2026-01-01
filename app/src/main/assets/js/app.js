// FacultyPro - Main Application Entry Point
// Handles initialization, profile management, and global event listeners

// --- APP INITIALIZATION ---
window.onload = async () => {
    console.log('🚀 FacultyPro Modular - Initializing...');

    // Set default export dates
    const exportEnd = document.getElementById('export-end');
    const exportStart = document.getElementById('export-start');
    
    if (exportEnd) exportEnd.valueAsDate = new Date();
    if (exportStart) exportStart.valueAsDate = new Date(new Date().setDate(new Date().getDate() - 30));

    // Initialize database
    if (window.DB) {
        await DB.initDB();
    } else {
        console.error("DB module not loaded!");
    }

    // Load initial data
    loadProfile();
    if (window.Classes) {
        Classes.loadClasses();
    }

    // Initialize Intervention Templates
    if (window.Intervention) {
        Intervention.init();
    }

    // Load Analytics Threshold
    if (window.Analytics) {
        Analytics.loadThreshold();
    }

    // Initialize License Engine (Apply Theme & Locks)
    if (window.License) {
        License.init();
    }

    console.log('✅ FacultyPro ready!');
};

// --- PROFILE FUNCTIONS ---
function loadProfile() {
    const name = localStorage.getItem('facultyName') || '';
    const phone = localStorage.getItem('facultyPhone') || '';
    const subject = localStorage.getItem('facultySubject') || '';

    const nameInput = document.getElementById('set-name');
    const phoneInput = document.getElementById('set-phone');
    const subjectInput = document.getElementById('set-subject');
    const greeting = document.getElementById('home-greeting');

    if (nameInput) nameInput.value = name;
    if (phoneInput) phoneInput.value = phone;
    if (subjectInput) subjectInput.value = subject;
    if (greeting) greeting.innerText = name || 'Faculty';

    // Update Profile Initials (Settings & Home)
    const initial = document.getElementById('profile-initial');
    const homeInitial = document.getElementById('home-profile-initial');
    const char = (name || 'F').charAt(0).toUpperCase();
    
    if (initial) initial.innerText = char;
    if (homeInitial) homeInitial.innerText = char;
    
    // Hardcoded gradients removed to respect Theme Variables (text-[var(--primary)])
}

function saveProfile() {
    const name = document.getElementById('set-name').value;
    const phone = document.getElementById('set-phone').value;
    const subject = document.getElementById('set-subject').value;

    localStorage.setItem('facultyName', name);
    localStorage.setItem('facultyPhone', phone);
    localStorage.setItem('facultySubject', subject);

    const greeting = document.getElementById('home-greeting');
    if (greeting) greeting.innerText = name || 'Faculty';
    
    // Update Initial Immediately
    const char = (name || 'F').charAt(0).toUpperCase();
    const initial = document.getElementById('profile-initial');
    const homeInitial = document.getElementById('home-profile-initial');
    
    if (initial) initial.innerText = char;
    if (homeInitial) homeInitial.innerText = char;
    
    if (window.UI) UI.showToast('Profile Saved');
}
window.saveProfile = saveProfile; // Expose to HTML buttons

// --- BACK BUTTON HANDLER ---
function handleBackPress() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;

    const pageId = activePage.id;

    if (pageId === 'page-attendance') {
        if (window.UI) UI.nav('page-home');
    } else if (pageId === 'page-manage' || pageId === 'page-export' || pageId === 'page-settings' || pageId === 'page-analytics') { // Added analytics
        if (window.UI) UI.nav('page-home');
    } else if (pageId === 'page-home') {
        // On home page, exit the app
        if (typeof Android !== 'undefined' && Android.exitApp) {
            Android.exitApp();
        }
    }
}
window.handleBackPress = handleBackPress;

console.log('✅ App initialized with back button handler');
