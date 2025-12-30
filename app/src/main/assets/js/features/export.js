// FacultyPro - Export Feature Module (PDF & CSV)
// Extracted from attendance.html for modular architecture

const Export = {
    // Load classes for export page
    loadExportClasses() {
        if (!db) return;
        const sel = document.getElementById('export-class');
        const tx = db.transaction('classes', 'readonly');
        
        tx.objectStore('classes').getAll().onsuccess = e => {
            const classes = e.target.result;
            sel.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(c => {
                sel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        };
    },

    // Generate report (PDF or CSV)
    async generateReport(format) {
        const clsId = document.getElementById('export-class').value;
        const startDate = document.getElementById('export-start').value;
        const endDate = document.getElementById('export-end').value;
        
        if (!clsId || !startDate || !endDate) {
            return UI.showToast("Fill all fields");
        }
        
        const cls = Classes.classes.find(c => c.id == clsId);
        if (!cls) return;
        
        UI.showToast("Generating report...");
        
        try {
            const studentsTx = db.transaction('students', 'readonly');
            const studentsStore = studentsTx.objectStore('students');
            const studentsIndex = studentsStore.index('classId');
            
            const students = await new Promise(resolve => {
                studentsIndex.getAll(parseInt(clsId)).onsuccess = e => resolve(e.target.result);
            });
            
            const attTx = db.transaction('attendance', 'readonly');
            const attStore = attTx.objectStore('attendance');
            const attIndex = attStore.index('classId');
            
            const attRecords = await new Promise(resolve => {
                attIndex.getAll(parseInt(clsId)).onsuccess = e => resolve(e.target.result);
            });
            
            const filtered = attRecords.filter(r => r.date >= startDate && r.date <= endDate);
            
            if (format === 'pdf') {
                this.generatePDF(cls, students, filtered, startDate, endDate);
            } else {
                this.generateCSV(cls, students, filtered, startDate, endDate);
            }
        } catch (error) {
            console.error('Export error:', error);
            UI.showToast("Export failed");
        }
    },

    // Generate PDF report
    generatePDF(cls, students, records, startDate, endDate) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Attendance Report - ${cls.name}`, 14, 20);
        
        doc.setFontSize(12);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
        
        const tableData = students.map(s => {
            let present = 0, absent = 0;
            records.forEach(r => {
                if (r.records && r.records[s.id]) {
                    r.records[s.id] === 'Present' ? present++ : absent++;
                }
            });
            const total = present + absent;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
            
            return [s.regNo, s.name, present.toString(), absent.toString(), `${percentage}%`];
        });
        
        doc.autoTable({
            head: [['Reg No', 'Name', 'Present', 'Absent', 'Percentage']],
            body: tableData,
            startY: 40
        });
        
        const fileName = `${cls.name}_Attendance_${startDate}_to_${endDate}.pdf`;
        
        // Use Android native method if available
        if (typeof Android !== 'undefined' && Android.saveToDownloads) {
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            Android.saveToDownloads(pdfBase64, fileName, 'application/pdf');
        } else {
            doc.save(fileName); // Browser fallback
        }
        
        UI.showToast("PDF Generated");
    },

    // Generate CSV report
    generateCSV(cls, students, records, startDate, endDate) {
        let csv = 'Reg No,Name,Present,Absent,Percentage\n';
        
        students.forEach(s => {
            let present = 0, absent = 0;
            records.forEach(r => {
                if (r.records && r.records[s.id]) {
                    r.records[s.id] === 'Present' ? present++ : absent++;
                }
            });
            const total = present + absent;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
            
            csv += `${s.regNo},${s.name},${present},${absent},${percentage}%\n`;
        });
        
        const fileName = `${cls.name}_Attendance_${startDate}_to_${endDate}.csv`;
        
        // Use Android native method if available
        if (typeof Android !== 'undefined' && Android.saveToDownloads) {
            Android.saveToDownloads(csv, fileName, 'text/csv');
        } else {
            // Browser fallback
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
        }
        
        UI.showToast("CSV Downloaded");
    }
};

// Export to global scope
window.Export = Export;

// For backward compatibility
window.loadExportClasses = () => Export.loadExportClasses();
window.generateReport = (format) => Export.generateReport(format);

console.log('✅ Export module loaded');
