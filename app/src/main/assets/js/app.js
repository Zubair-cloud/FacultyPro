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
        await License.init();
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

    // Load Mentor Names (9.1.3)
    const mentor1Input = document.getElementById('mentor1-name-input');
    const mentor2Input = document.getElementById('mentor2-name-input');
    const mentor1Name = localStorage.getItem('mentor1_name') || '';
    const mentor2Name = localStorage.getItem('mentor2_name') || '';
    
    if (mentor1Input) mentor1Input.value = mentor1Name;
    if (mentor2Input) mentor2Input.value = mentor2Name;

    // Update Profile Initials (Settings & Home)
    const initial = document.getElementById('profile-initial');
    const homeInitial = document.getElementById('home-profile-initial');
    const char = (name || 'F').charAt(0).toUpperCase();
    
    if (initial) initial.innerText = char;
    if (homeInitial) homeInitial.innerText = char;
    
    // Load mentor class display
    updateMentorClassDisplay();
}

// --- MENTOR CLASS FUNCTIONS ---
function updateMentorClassDisplay() {
    const mentorClassId = localStorage.getItem('mentorClassId');
    const mentorSection = document.getElementById('home-mentor-section');
    const mentorClassName = document.getElementById('home-mentor-class-name');
    const mentorSelect = document.getElementById('set-mentor-class');
    
    // Restore dropdown selection in settings
    if (mentorSelect && mentorClassId) {
        mentorSelect.value = mentorClassId;
    }
    
    // M4 FIX: Check if classes array exists
    if (!window.classes || window.classes.length === 0) {
        console.warn('Classes not loaded yet');
        return;
    }
    
    // Update home page mentor section
    if (mentorClassId) { // Removed window.classes check here as it's done above
        const cls = window.classes.find(c => c.id == mentorClassId);
        if (cls) {
            if (mentorSection) mentorSection.classList.remove('hidden');
            if (mentorClassName) mentorClassName.innerText = cls.name;
        } else {
            if (mentorSection) mentorSection.classList.add('hidden');
        }
    } else {
        if (mentorSection) mentorSection.classList.add('hidden');
    }
}

function saveMentorClass() {
    const select = document.getElementById('set-mentor-class');
    if (select) {
        const classId = select.value;
        if (classId) {
            localStorage.setItem('mentorClassId', classId);
        } else {
            localStorage.removeItem('mentorClassId');
        }
        updateMentorClassDisplay();
        if (window.UI) UI.showToast('Mentor Class Saved');
    }
}
window.saveMentorClass = saveMentorClass;
window.updateMentorClassDisplay = updateMentorClassDisplay;

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
