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
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better width

        // 1. Prepare Data
        // Sort records by date
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Extract unique dates for columns
        const dates = records.map(r => r.date);

        if (dates.length === 0) {
            UI.showToast("No attendance data in range");
            return;
        }

        const dateChunkSize = 7; // Max dates per page
        
        // Loop through chunks of dates
        for (let i = 0; i < dates.length; i += dateChunkSize) {
            if (i > 0) doc.addPage(); // New page for next chunk

            const currentDates = dates.slice(i, i + dateChunkSize);
            
            // Header
            doc.setFontSize(14);
            doc.text(`Attendance Report - ${cls.name}`, 14, 15);
            doc.setFontSize(10);
            const pageNum = Math.floor(i / dateChunkSize) + 1;
            const totalPages = Math.ceil(dates.length / dateChunkSize);
            doc.text(`Page ${pageNum} of ${totalPages} (Dates: ${currentDates[0]} to ${currentDates[currentDates.length-1]})`, 14, 22);

            // Table Headers
            // Formatted dates for header (e.g., "Dec 31")
            const dateHeaders = currentDates.map(d => {
                const doer = new Date(d);
                return `${doer.getDate()}/${doer.getMonth()+1}`;
            });
            const head = [['Reg No', 'Name', ...dateHeaders]];

            // Table Body
            const body = students.map(s => {
                const row = [s.regNo, s.name];
                currentDates.forEach(date => {
                    // Find record for this date
                    const record = records.find(r => r.date === date);
                    const status = record && record.records && record.records[s.id] ? record.records[s.id] : '-';
                    // Simplify status for space (P/A)
                    row.push(status.charAt(0)); 
                });
                return row;
            });

            doc.autoTable({
                head: head,
                body: body,
                startY: 25,
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [22, 163, 74] }, // Green header
                columnStyles: {
                    0: { cellWidth: 30, fontStyle: 'bold' }, // Reg No
                    1: { cellWidth: 50, fontStyle: 'bold' }  // Name
                    // Remaining columns will auto-size
                }
            });
        }
        
        const fileName = `${cls.name}_Report.pdf`;
        
        // Save
        if (typeof Android !== 'undefined' && Android.saveToDownloads) {
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            Android.saveToDownloads(pdfBase64, fileName, 'application/pdf');
        } else {
            doc.save(fileName);
        }
        UI.showToast("PDF Generated");
    },

    // Generate CSV report
    generateCSV(cls, students, records, startDate, endDate) {
        // Sort records by date
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        const dates = records.map(r => r.date);

        if (dates.length === 0) {
            UI.showToast("No attendance data in range");
            return;
        }

        // Header Row
        let csv = 'Reg No,Name';
        dates.forEach(d => csv += `,${d}`);
        csv += '\n';
        
        // Data Rows
        students.forEach(s => {
            csv += `${s.regNo},${s.name}`;
            dates.forEach(date => {
                const record = records.find(r => r.date === date);
                const status = record && record.records && record.records[s.id] ? record.records[s.id] : '-';
                csv += `,${status}`;
            });
            csv += '\n';
        });
        
        const fileName = `${cls.name}_Report.csv`;
        
        if (typeof Android !== 'undefined' && Android.saveToDownloads) {
            Android.saveToDownloads(csv, fileName, 'text/csv');
        } else {
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
