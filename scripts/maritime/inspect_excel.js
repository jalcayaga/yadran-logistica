const XLSX = require('xlsx');

const filePath = '/home/astrodev/Desktop/logistica-yadran/public/Trazabilidad Estructuras CY.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(JSON.stringify({
        columns: data.length > 0 ? Object.keys(data[0]) : [],
        sample: data.slice(0, 5)
    }, null, 2));
} catch (error) {
    console.error('Error reading Excel:', error.message);
}
