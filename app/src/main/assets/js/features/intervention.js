// FacultyPro - Intervention Engine
// "The Mouth" of the system. Generates letters and handles communication.

const Intervention = {
    // Default Templates
    defaultTemplate: `Dear Parent,

This is to inform you that your ward, {name} (Reg: {regNo}), has very low attendance of {percentage} in {subject}.

They have attended {present} out of {total} classes.
Please ensure they attend regular classes to avoid strict action.

Regards,
{facultyName}
{department}`,

    appreciationTemplate: `Dear Parent,

We are pleased to inform you that your ward, {name} (Reg: {regNo}), has maintained excellent attendance of {percentage} in {subject}.

They have attended {present} out of {total} classes.
Keep up the great work!

Warm Regards,
{facultyName}
{department}`,

    // State
    templates: [],
    currentEditId: null,

    init() {
        this.loadTemplates();
    },

    loadTemplates() {
        const stored = localStorage.getItem('intervention_templates');
        if (stored) {
            this.templates = JSON.parse(stored);
        } else {
            // Default Templates (Warning + Appreciation)
            this.templates = [
                {
                    id: Date.now(),
                    title: "⚠️ Low Attendance Warning",
                    content: this.defaultTemplate,
                    isDefault: true,
                    type: 'warning' // For auto-selection
                },
                {
                    id: Date.now() + 1,
                    title: "🌟 Appreciation Letter",
                    content: this.appreciationTemplate,
                    isDefault: false,
                    type: 'appreciation'
                }
            ];
            this.saveToStorage();
        }
    },

    saveToStorage() {
        localStorage.setItem('intervention_templates', JSON.stringify(this.templates));
    },

    // --- UI: Manager (List) ---
    openTemplateManager() {
        this.loadTemplates();
        const container = document.getElementById('template-list-container');
        container.innerHTML = '';

        this.templates.forEach(t => {
            const card = document.createElement('div');
            card.className = "p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer group";
            card.onclick = () => this.editTemplate(t.id);
            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="text-white font-bold text-sm ${t.isDefault ? 'text-[#DEBE63]' : ''}">${t.title}</h4>
                        <p class="text-gray-500 text-xs mt-1 truncate w-48">${t.content.substring(0, 50)}...</p>
                    </div>
                    <span class="material-symbols-outlined text-gray-500 group-hover:text-white transition">edit</span>
                </div>
            `;
            container.appendChild(card);
        });

        UI.openModal('modal-templates-list');
    },

    // --- UI: Editor ---
    createNewTemplate() {
        this.currentEditId = null;
        document.getElementById('edit-template-title').value = "";
        document.getElementById('edit-template-body').value = this.defaultTemplate;
        UI.closeModal('modal-templates-list');
        UI.openModal('modal-template-editor');
    },

    editTemplate(id) {
        const t = this.templates.find(x => x.id == id);
        if (!t) return;

        this.currentEditId = id;
        document.getElementById('edit-template-title').value = t.title;
        document.getElementById('edit-template-body').value = t.content;
        
        UI.closeModal('modal-templates-list');
        UI.openModal('modal-template-editor');
    },

    saveEditorContent() {
        const title = document.getElementById('edit-template-title').value || "Untitled";
        const body = document.getElementById('edit-template-body').value;

        if (this.currentEditId) {
            // Update
            const idx = this.templates.findIndex(x => x.id == this.currentEditId);
            if (idx !== -1) {
                this.templates[idx].title = title;
                this.templates[idx].content = body;
            }
        } else {
            // Create
            this.templates.push({
                id: Date.now(),
                title: title,
                content: body,
                isDefault: false
            });
        }

        this.saveToStorage();
        UI.showToast("Template Saved!");
        UI.closeModal('modal-template-editor');
        this.openTemplateManager(); // Go back to list
    },

    deleteTemplate() {
        if (!this.currentEditId) return; // Can't delete unsaved
        if (confirm("Delete this template?")) {
             this.templates = this.templates.filter(x => x.id != this.currentEditId);
             this.saveToStorage();
             UI.closeModal('modal-template-editor');
             this.openTemplateManager();
        }
    },

    // Reset to default templates
    resetToDefaults() {
        if (confirm("Reset all templates to defaults? Your custom templates will be lost.")) {
            localStorage.removeItem('intervention_templates');
            this.templates = [];
            this.loadTemplates(); // This will create defaults
            UI.showToast("Templates Reset! ✅");
            this.openTemplateManager();
        }
    },

    // --- Editor Helpers ---
    insertTag(tag) {
        const textarea = document.getElementById('edit-template-body');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after  = text.substring(end, text.length);
        
        textarea.value = (before + tag + after);
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        textarea.focus();
    },

    // --- Overrides ---
    // Get the template to use for generating letter
    // Auto-selects based on configurable threshold
    getTemplate(percentage = 0) {
        if (this.templates.length === 0) this.init();
        
        // Get threshold from Analytics or localStorage
        const threshold = (window.Analytics && Analytics.getThreshold) 
            ? Analytics.getThreshold() 
            : (parseInt(localStorage.getItem('appreciation_threshold')) || 80);
        
        // Smart Selection
        let selected;
        if (percentage >= threshold) {
            selected = this.templates.find(x => x.type === 'appreciation');
        } else {
            selected = this.templates.find(x => x.type === 'warning');
        }
        
        // Fallback to default or first
        if (!selected) {
            selected = this.templates.find(x => x.isDefault) || this.templates[0];
        }
        
        return selected ? selected.content : this.defaultTemplate;
    },

    // ⚡ Generate Letter
    generateLetter(student) {
        // Parse percentage as number for smart template selection
        const pct = parseInt(student.percentage) || 0;
        let text = this.getTemplate(pct);
        
        // Context Variables
        const facultyName = localStorage.getItem('facultyName') || "Faculty";
        const subject = localStorage.getItem('facultySubject') || "Class";
        
        // Replacements
        text = text.replace(/{name}/g, student.name);
        text = text.replace(/{regNo}/g, student.regNo);
        text = text.replace(/{percentage}/g, student.percentage);
        text = text.replace(/{present}/g, student.presentCount);
        text = text.replace(/{total}/g, student.totalCount);
        text = text.replace(/{subject}/g, subject);
        text = text.replace(/{facultyName}/g, facultyName);
        text = text.replace(/{department}/g, "Department"); // Placeholder

        return text;
    },

    // Open Action Modal (From Analytics Profile)
    openActionModal(student) {
        // 1. Generate Letter
        const letter = this.generateLetter(student);

        // 2. Populate Modal
        document.getElementById('intervention-preview').value = letter;
        document.getElementById('intervention-student-id').value = student.id; // Hidden ID

        // 3. Show Modal
        UI.openModal('modal-intervention');
    },

    // Show Export Options (PDF or Word)
    showExportOptions() {
        const studentId = document.getElementById('intervention-student-id').value;
        if (!studentId) return UI.showToast("Error: No student selected");
        
        // Use a simple prompt or a custom sub-modal. For now, a custom bottom sheet would be best, 
        // but to save time, let's use the UI.showConfirm-style or just buttons in the modal.
        // Actually, the user asked for options *when clicking share*.
        // So we will replace the Share Buttons with "Export As..." buttons, or specific PDF/Word buttons.
        
        // But for now, let's just trigger the logic directly from new buttons we'll add to the HTML.
    },

    // 📄 GENERATE & SHARE PDF
    async sharePDF() {
        try {
            UI.showToast("Generating PDF... 📄");
            if (!window.jspdf) throw new Error("jsPDF library not loaded");
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const text = document.getElementById('intervention-preview').value;
            
            // --- 1. Header (Logo & Title) ---
            // Use pre-loaded Base64 logo from dsu_logo.js
            if (typeof DSU_LOGO_BASE64 !== 'undefined') {
                try {
                    doc.addImage(DSU_LOGO_BASE64, 'PNG', 15, 10, 25, 25); // x, y, w, h
                } catch(e) {
                    console.error("Image add failed", e);
                }
            } else {
                console.warn("DSU_LOGO_BASE64 not defined");
            }
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(222, 190, 99); // Gold (#DEBE63)
            doc.text("DHANALAKSHMI SRINIVASAN", 50, 20);
            doc.text("UNIVERSITY", 50, 28);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Samayapuram, Tiruchirappalli - 621112", 50, 34);

            doc.setLineWidth(0.5);
            doc.setDrawColor(200);
            doc.line(10, 40, 200, 40); // Horizontal Line

            // --- 2. Body Text ---
            doc.setFont("times", "normal");
            doc.setFontSize(12);
            doc.setTextColor(0);
            
            const splitText = doc.splitTextToSize(text, 170);
            doc.text(splitText, 15, 60);

            // --- 3. Footer ---
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Generated by FacultyPro • Zinc Labs", 15, 280);

            // --- 4. Export to Base64 & Share ---
            const base64PDF = doc.output('datauristring').split(',')[1]; // Remove prefix
            
            if (typeof Android !== 'undefined' && Android.shareFile) {
                Android.shareFile(base64PDF, "Intervention_Letter.pdf", "application/pdf");
            } else {
                doc.save("Intervention_Letter.pdf");
            }
            
        } catch (e) {
            console.error(e);
            UI.showToast("PDF Error: " + e.message);
        }
    },

    // 📝 GENERATE & SHARE RTF (Universal Word Comp)
    shareWord() {
        UI.showToast("Generating Document... 📝");
        
        const letterText = document.getElementById('intervention-preview').value;
        
        // 1. Prepare Logo (Base64 -> Hex for RTF)
        let logoHex = "";
        try {
            if (typeof DSU_LOGO_BASE64 !== 'undefined') {
                // Strip "data:image/png;base64," prefix
                const b64 = DSU_LOGO_BASE64.split(',')[1];
                logoHex = this.base64ToHex(b64);
            }
        } catch (e) { console.error("Logo Hex Conversion Failed", e); }

        // 2. Generate RTF Content
        const rtfContent = this.generateRTF(letterText, logoHex);
        
        // 3. Convert to Base64 for Android Bridge
        const rtfBase64 = this.stringToBase64(rtfContent);
        const fileName = "Intervention_Letter_" + Date.now() + ".rtf";

        // 4. Save & Share
        if (typeof Android !== 'undefined') {
            // Save first
            if (Android.saveToDownloads) {
                Android.saveToDownloads(rtfBase64, fileName, "text/rtf"); // application/rtf
            }
            
            // Then Share
            if (Android.shareFile) {
                setTimeout(() => {
                    Android.shareFile(rtfBase64, fileName, "text/rtf");
                }, 500); // Small delay to ensure save toast clears
            }
        } else {
            // Browser Fallback
            const blob = new Blob([rtfContent], { type: 'text/rtf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
        }
    },

    // --- RTF Generator Helpers ---

    generateRTF(text, logoHex) {
        // Basic RTF Header & Font Table
        let rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}{\\f1\\fswiss\\fcharset0 Arial;}}
{\\colortbl;\\red222\\green190\\blue99;\\red100\\green100\\blue100;}
`;

        // Logo (if exists)
        if (logoHex) {
            // pngblip = PNG image, picw/pich = dimensions
            rtf += `{\\pard\\qc\\sb200\\sa200 {\\pict\\pngblip\\picw2500\\pich2500\\picwgoal1500\\pichgoal1500 ${logoHex}} \\par}\n`;
        }

        // Header: University Name (Gold)
        rtf += `{\\pard\\qc\\sb100\\sa100\\b\\f1\\fs36\\cf1 DHANALAKSHMI SRINIVASAN UNIVERSITY \\par}\n`;
        
        // Subheader: Address (Gray)
        rtf += `{\\pard\\qc\\sb60\\sa200\\b0\\fs20\\cf2 Samayapuram, Tiruchirappalli - 621112 \\par}\n`;
        
        // Horizontal Line (Series of underscores or actual graphic line)
        rtf += `{\\pard\\qc\\cf2 ________________________________________________________________________________ \\par}\n`;
        rtf += `{\\pard\\sb400\\sa200\\cf0 \\par}\n`; // Spacer

        // Body Text
        // Replace newlines with \par
        const paragraphs = text.split('\n');
        paragraphs.forEach(p => {
            if (p.trim() === "") {
                rtf += `{\\pard\\sb100\\sa100 \\par}\n`; // Empty line
            } else {
                rtf += `{\\pard\\sl480\\slmult1\\sb100\\sa100\\f0\\fs24 ${this.escapeRTF(p)} \\par}\n`;
            }
        });

        // Footer
        rtf += `{\\pard\\sb600\\sa200\\qc\\fs18\\cf2 Generated by FacultyPro \\u8226? Zinc Labs \\par}`;
        
        rtf += `}`; // Close RTF
        return rtf;
    },

    // Safety: Escape RTF special characters
    escapeRTF(str) {
        return str.replace(/\\/g, '\\\\')
                  .replace(/\{/g, '\\{')
                  .replace(/\}/g, '\\}');
    },

    // Convert Base64 string to Hex string
    base64ToHex(str) {
        const raw = atob(str);
        let result = '';
        for (let i = 0; i < raw.length; i++) {
            const hex = raw.charCodeAt(i).toString(16);
            result += (hex.length === 2 ? hex : '0' + hex);
        }
        return result;
    },

    // Convert String to Base64 (Unicode Safe)
    stringToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    },



    // Helper: Load Image as Base64 for PDF (With Timeout)
    loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.error("Image load error for: " + url);
                resolve(null);
            };
            // Timeout after 3 seconds
            setTimeout(() => {
                if (!img.complete) {
                    console.warn("Image load timed out: " + url);
                    resolve(null);
                }
            }, 3000);
            img.src = url;
        });
    },

    // Share via WhatsApp (Intent)
    shareWhatsApp() {
        const text = document.getElementById('intervention-preview').value;
        const encodedText = encodeURIComponent(text);
        
        // This usually opens the app chooser in Android WebView
        window.location.href = `whatsapp://send?text=${encodedText}`;
    },

    // Share via Generic Share Sheet (Android Interface)
    shareGeneric() {
        const text = document.getElementById('intervention-preview').value;
        
        if (typeof Android !== 'undefined' && Android.shareText) {
            Android.shareText(text); // Need to implement this in Java if not present
        } else {
            // Fallback for web testing
            if (navigator.share) {
                navigator.share({
                    title: 'Intervention Letter',
                    text: text
                }).catch(console.error);
            } else {
                // Clipboard fallback
                navigator.clipboard.writeText(text);
                UI.showToast("Copied to Clipboard");
            }
        }
    }
};

window.Intervention = Intervention;
console.log('⚡ Intervention Engine Loaded');
