const XLSX = require('xlsx');

const filePath = '/home/astrodev/Desktop/logistica-yadran/public/Trazabilidad Estructuras CY.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    workbook.SheetNames.forEach(sheetName => {
        console.log(`--- Sheet: ${sheetName} ---`);
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length > 0) {
            // Look for rows that might be headers
            for (let i = 0; i < Math.min(20, data.length); i++) {
                const row = data[i];
                if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('lat') || cell.toLowerCase().includes('lon')))) {
                    console.log(`Found header candidates at row ${i}:`, row);
                }
            }
        }
    });
} catch (error) {
    console.error('Error reading Excel:', error.message);
}
