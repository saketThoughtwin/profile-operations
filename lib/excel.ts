import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { uploadRawToCloudinary, getRawFromCloudinary } from './cloudinary';

// In Vercel/AWS Lambda, only /tmp is writable
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DATA_DIR = IS_PRODUCTION ? '/tmp' : process.cwd();
const SOURCE_DIR = process.cwd(); // Where the initial files are located
const SINGLE_FILE_NAME = 'data.xlsx'; // Single consolidated Excel file
const CLOUDINARY_RAW_URL = process.env.CLOUDINARY_EXCEL_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/excel_data/data_xlsx` : null);

/**
 * Ensure the data file exists in the writable directory and is synced with Cloudinary
 */
let isSynced = false;

export const ensureDataFile = async () => {
    const targetPath = path.join(DATA_DIR, SINGLE_FILE_NAME);

    // If already synced in this instance, skip
    if (isSynced && fs.existsSync(targetPath)) return;

    // 1. Try to sync from Cloudinary if URL is provided
    if (CLOUDINARY_RAW_URL && !fs.existsSync(targetPath)) {
        try {
            console.log('Syncing data.xlsx from Cloudinary...');
            const buffer = await getRawFromCloudinary(CLOUDINARY_RAW_URL);
            fs.writeFileSync(targetPath, buffer);
            isSynced = true;
            console.log('Successfully synced from Cloudinary');
            return;
        } catch (error) {
            console.error('Failed to sync from Cloudinary:', error);
        }
    }

    // 2. Fallback to local source if file doesn't exist in writable dir
    if (!fs.existsSync(targetPath)) {
        const sourcePath = path.join(SOURCE_DIR, SINGLE_FILE_NAME);

        if (fs.existsSync(sourcePath)) {
            try {
                const data = fs.readFileSync(sourcePath);
                fs.writeFileSync(targetPath, data);
                console.log(`Copied ${SINGLE_FILE_NAME} to ${targetPath}`);
            } catch (error) {
                console.error(`Error copying ${SINGLE_FILE_NAME} to ${targetPath}:`, error);
                createEmptyWorkbook(targetPath);
            }
        } else {
            createEmptyWorkbook(targetPath);
        }
    }
    isSynced = true;
};

const syncToCloudinary = async () => {
    if (!IS_PRODUCTION) return; // Only sync to Cloudinary in production

    try {
        const filePath = path.join(DATA_DIR, SINGLE_FILE_NAME);
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const url = await uploadRawToCloudinary(buffer, 'data_xlsx', 'excel_data');
            console.log('Synced data.xlsx to Cloudinary:', url);
        }
    } catch (error) {
        console.error('Failed to sync to Cloudinary:', error);
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
export const readExcelSheet = async (fileName: string, sheetName?: string): Promise<any[]> => {
    await ensureDataFile();

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
export const writeExcelSheet = async (fileName: string, sheetName: string, data: any[]): Promise<void> => {
    await ensureDataFile();

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

        // Asynchronously sync to Cloudinary
        syncToCloudinary();
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        throw error;
    }
};

/**
 * Get all sheet names from the consolidated Excel file
 */
export const getAllSheets = async (fileName?: string): Promise<string[]> => {
    await ensureDataFile();
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
export const appendToExcelSheet = async (fileName: string, sheetName: string, newData: any): Promise<void> => {
    const currentData = await readExcelSheet(SINGLE_FILE_NAME, sheetName);
    currentData.push(newData);
    await writeExcelSheet(SINGLE_FILE_NAME, sheetName, currentData);
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
export const readExcel = async (fileName: string) => {
    const sheetName = getSheetNameFromFileName(fileName);
    return await readExcelSheet(SINGLE_FILE_NAME, sheetName);
};

export const writeExcel = async (fileName: string, data: any[]) => {
    const sheetName = getSheetNameFromFileName(fileName);
    await writeExcelSheet(SINGLE_FILE_NAME, sheetName, data);
};

export const appendToExcel = async (fileName: string, newData: any) => {
    const sheetName = getSheetNameFromFileName(fileName);
    await appendToExcelSheet(SINGLE_FILE_NAME, sheetName, newData);
};

export const updateOrAppendToExcel = async (fileName: string, newData: any, matchKey: string) => {
    const sheetName = getSheetNameFromFileName(fileName);
    const currentData = await readExcelSheet(SINGLE_FILE_NAME, sheetName);

    const index = currentData.findIndex((item: any) => item[matchKey] === newData[matchKey]);

    if (index !== -1) {
        // Update existing
        // Keep original createdAt if it exists
        if (currentData[index].createdAt && !newData.createdAt) {
            newData.createdAt = currentData[index].createdAt;
        }
        currentData[index] = { ...currentData[index], ...newData, updatedAt: new Date().toISOString() };
    } else {
        // Append new
        currentData.push({ ...newData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    await writeExcelSheet(SINGLE_FILE_NAME, sheetName, currentData);
};
