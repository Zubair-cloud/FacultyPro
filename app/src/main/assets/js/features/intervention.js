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
            : (parseInt(localStorage.getItem('appreciation_threshold')) || 75);
        
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
            UI.showToast("Debug: Init PDF...");
            if (!window.jspdf) throw new Error("jsPDF library not loaded");
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const text = document.getElementById('intervention-preview').value;
            
            // --- 1. Header (Logo & Title) ---
            UI.showToast("Debug: Loading Image...");
            const logoImg = await this.loadImage('institutions/dsu/logos/dsulogo.png');
            
            if (logoImg) {
                try {
                    doc.addImage(logoImg, 'PNG', 15, 10, 25, 25); // x, y, w, h
                    UI.showToast("Debug: Image Added");
                } catch(e) {
                    console.error("Image add failed", e);
                    UI.showToast("Debug: Image Add Failed (Skipping)");
                }
            } else {
                UI.showToast("Debug: Image Not Found (Skipping)");
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
            UI.showToast("Debug: Creating Base64...");
            const base64PDF = doc.output('datauristring').split(',')[1]; // Remove prefix
            
            UI.showToast("Debug: Sending to Android...");
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

    // 📝 GENERATE & SHARE WORD (DOCX)
    shareWord() {
        UI.showToast("Generating Word Doc... 📝");
        
        const text = document.getElementById('intervention-preview').value;
        const paragraphs = text.split('\n').map(line => `<p style="font-size:12pt; font-family: 'Times New Roman';">${line}</p>`).join('');

        // Simple HTML structure for the Doc
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Times New Roman', serif; }
                    .header { text-align: center; color: #DEBE63; font-weight: bold; font-size: 18pt; }
                    .sub-header { text-align: center; color: #666; font-size: 10pt; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                </style>
            </head>
            <body>
                <div class="header">DHANALAKSHMI SRINIVASAN UNIVERSITY</div>
                <div class="sub-header">Samayapuram, Tiruchirappalli - 621112</div>
                ${paragraphs}
                <br><br>
                <p style="font-size: 9pt; color: #888;">Generated by FacultyPro • Zinc Labs</p>
            </body>
            </html>
        `;

        if (window.htmlDocx) {
            const converted = htmlDocx.asBlob(htmlContent);
            
            // Convert Blob to Base64 for Android Bridge
            const reader = new FileReader();
            reader.readAsDataURL(converted);
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                if (typeof Android !== 'undefined' && Android.shareFile) {
                    Android.shareFile(base64data, "Intervention_Letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                } else {
                    // Browser Download Fallback
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(converted);
                    link.download = "Intervention_Letter.docx";
                    link.click();
                }
            };
        } else {
            UI.showToast("Error: Word generator not loaded");
        }
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
