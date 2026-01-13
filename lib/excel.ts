import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.cwd();
const SINGLE_FILE_NAME = 'data.xlsx'; // Single consolidated Excel file

/**
 * Add serial numbers to data array
 */
const addSerialNumbers = (data: any[]): any[] => {
    return data.map((item, index) => ({
        serialNo: index + 1,
        ...item,
    }));
};

/**
 * Read from a specific sheet in an Excel file
 * @param fileName - Name of the Excel file (or legacy filename for backward compatibility)
 * @param sheetName - Name of the sheet (optional for legacy support)
 */
export const readExcelSheet = (fileName: string, sheetName?: string): any[] => {
    // Use single file for all operations
    const filePath = path.join(DATA_DIR, SINGLE_FILE_NAME);

    if (!fs.existsSync(filePath)) {
        return [];
    }

    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Determine which sheet to read
    const targetSheet = sheetName || getSheetNameFromFileName(fileName);

    if (!workbook.Sheets[targetSheet]) {
        return [];
    }

    const sheet = workbook.Sheets[targetSheet];
    return XLSX.utils.sheet_to_json(sheet);
};

/**
 * Write to a specific sheet in the consolidated Excel file
 * Automatically adds serial numbers to each row
 * @param fileName - Legacy filename (for backward compatibility) or actual filename
 * @param sheetName - Name of the sheet
 * @param data - Data to write
 */
export const writeExcelSheet = (fileName: string, sheetName: string, data: any[]): void => {
    // Always use single file
    const filePath = path.join(DATA_DIR, SINGLE_FILE_NAME);
    let workbook: XLSX.WorkBook;

    // Load existing workbook or create new one
    if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        workbook = XLSX.read(buffer, { type: 'buffer' });
    } else {
        workbook = XLSX.utils.book_new();
    }

    // Add serial numbers
    const dataWithSerial = addSerialNumbers(data);

    // Create or update sheet
    const worksheet = XLSX.utils.json_to_sheet(dataWithSerial);

    if (workbook.Sheets[sheetName]) {
        workbook.Sheets[sheetName] = worksheet;
    } else {
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);
};

/**
 * Get all sheet names from the consolidated Excel file
 */
export const getAllSheets = (fileName?: string): string[] => {
    const filePath = path.join(DATA_DIR, SINGLE_FILE_NAME);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames;
};

/**
 * Append data to a specific sheet in the consolidated file
 * @param fileName - Legacy filename (for backward compatibility)
 * @param sheetName - Name of the sheet
 * @param newData - New data to append
 */
export const appendToExcelSheet = (fileName: string, sheetName: string, newData: any): void => {
    const currentData = readExcelSheet(SINGLE_FILE_NAME, sheetName);
    currentData.push(newData);
    writeExcelSheet(SINGLE_FILE_NAME, sheetName, currentData);
};

/**
 * Helper function to map legacy filenames to sheet names
 */
const getSheetNameFromFileName = (fileName: string): string => {
    const sheetMap: { [key: string]: string } = {
        'users.xlsx': 'Users',
        'profiles.xlsx': 'Profiles',
        'pending_registrations.xlsx': 'PendingRegistrations',
        'settings.xlsx': 'Settings',
        'admins.xlsx': 'Admins',
    };

    return sheetMap[fileName] || 'Sheet1';
};

// Legacy functions for backward compatibility
export const readExcel = (fileName: string) => {
    const sheetName = getSheetNameFromFileName(fileName);
    return readExcelSheet(SINGLE_FILE_NAME, sheetName);
};

export const writeExcel = (fileName: string, data: any[]) => {
    const sheetName = getSheetNameFromFileName(fileName);
    writeExcelSheet(SINGLE_FILE_NAME, sheetName, data);
};

export const appendToExcel = (fileName: string, newData: any) => {
    const sheetName = getSheetNameFromFileName(fileName);
    appendToExcelSheet(SINGLE_FILE_NAME, sheetName, newData);
};
