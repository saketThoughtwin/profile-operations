import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// In Vercel/AWS Lambda, only /tmp is writable
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DATA_DIR = IS_PRODUCTION ? '/tmp' : process.cwd();
const SOURCE_DIR = process.cwd(); // Where the initial files are located
const SINGLE_FILE_NAME = 'data.xlsx'; // Single consolidated Excel file

/**
 * Ensure the data file exists in the writable directory
 */
const ensureDataFile = () => {
    const targetPath = path.join(DATA_DIR, SINGLE_FILE_NAME);

    // If file doesn't exist in writable dir
    if (!fs.existsSync(targetPath)) {
        const sourcePath = path.join(SOURCE_DIR, SINGLE_FILE_NAME);

        // Try to copy from source if it exists
        if (fs.existsSync(sourcePath)) {
            try {
                const data = fs.readFileSync(sourcePath);
                fs.writeFileSync(targetPath, data);
                console.log(`Copied ${SINGLE_FILE_NAME} to ${targetPath}`);
            } catch (error) {
                console.error(`Error copying ${SINGLE_FILE_NAME} to ${targetPath}:`, error);
                // Create empty if copy fails
                createEmptyWorkbook(targetPath);
            }
        } else {
            // Create new if source doesn't exist
            createEmptyWorkbook(targetPath);
        }
    }
};

const createEmptyWorkbook = (filePath: string) => {
    const workbook = XLSX.utils.book_new();
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);
    console.log(`Created new workbook at ${filePath}`);
};

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
    ensureDataFile();

    // Use single file for all operations
    const filePath = path.join(DATA_DIR, SINGLE_FILE_NAME);

    if (!fs.existsSync(filePath)) {
        return [];
    }

    try {
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Determine which sheet to read
        const targetSheet = sheetName || getSheetNameFromFileName(fileName);

        if (!workbook.Sheets[targetSheet]) {
            return [];
        }

        const sheet = workbook.Sheets[targetSheet];
        return XLSX.utils.sheet_to_json(sheet);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

/**
 * Write to a specific sheet in the consolidated Excel file
 * Automatically adds serial numbers to each row
 * @param fileName - Legacy filename (for backward compatibility) or actual filename
 * @param sheetName - Name of the sheet
 * @param data - Data to write
 */
export const writeExcelSheet = (fileName: string, sheetName: string, data: any[]): void => {
    ensureDataFile();

    // Always use single file
    const filePath = path.join(DATA_DIR, SINGLE_FILE_NAME);
    let workbook: XLSX.WorkBook;

    try {
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
        console.log(`Successfully wrote to ${filePath}`);
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        throw error;
    }
};

/**
 * Get all sheet names from the consolidated Excel file
 */
export const getAllSheets = (fileName?: string): string[] => {
    ensureDataFile();
    const filePath = path.join(DATA_DIR, SINGLE_FILE_NAME);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        return workbook.SheetNames;
    } catch (error) {
        console.error(`Error reading sheets from ${filePath}:`, error);
        return [];
    }
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
