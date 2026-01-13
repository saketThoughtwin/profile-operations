/**
 * Migration Script: Consolidate separate Excel files into single data.xlsx
 * Run this once to migrate from multiple files to single file structure
 */

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.cwd();
const NEW_FILE = 'data.xlsx';

// Files to migrate
const filesToMigrate = [
    { oldFile: 'users.xlsx', sheetName: 'Users' },
    { oldFile: 'profiles.xlsx', sheetName: 'Profiles' },
    { oldFile: 'settings.xlsx', sheetName: 'Settings' },
    { oldFile: 'pending_registrations.xlsx', sheetName: 'PendingRegistrations' }
];

function addSerialNumbers(data: any[]): any[] {
    return data.map((item, index) => ({
        serialNo: index + 1,
        ...item,
    }));
}

function migrateToSingleFile() {
    const newFilePath = path.join(DATA_DIR, NEW_FILE);
    const workbook = XLSX.utils.book_new();

    console.log('Starting migration to consolidated data.xlsx...\n');

    filesToMigrate.forEach(({ oldFile, sheetName }) => {
        const oldFilePath = path.join(DATA_DIR, oldFile);

        if (fs.existsSync(oldFilePath)) {
            console.log(`✓ Found ${oldFile}, migrating to ${sheetName} sheet...`);

            // Read old file
            const buffer = fs.readFileSync(oldFilePath);
            const oldWorkbook = XLSX.read(buffer, { type: 'buffer' });
            const oldSheetName = oldWorkbook.SheetNames[0];
            const oldSheet = oldWorkbook.Sheets[oldSheetName];

            // Convert to JSON
            let data = XLSX.utils.sheet_to_json(oldSheet);

            // Remove old serialNo if it exists
            data = data.map((row: any) => {
                const { serialNo, ...rest } = row;
                return rest;
            });

            // Add new serial numbers
            const dataWithSerial = addSerialNumbers(data);

            // Create new sheet
            const newSheet = XLSX.utils.json_to_sheet(dataWithSerial);
            XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);

            console.log(`  → Migrated ${data.length} rows to ${sheetName} sheet`);
        } else {
            console.log(`⚠ ${oldFile} not found, creating empty ${sheetName} sheet...`);
            // Create empty sheet
            const emptySheet = XLSX.utils.json_to_sheet([]);
            XLSX.utils.book_append_sheet(workbook, emptySheet, sheetName);
        }
    });

    // Write consolidated file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(newFilePath, buffer);

    console.log(`\n✅ Successfully created ${NEW_FILE} with all data!`);
    console.log('\nSheets in data.xlsx:');
    console.log('  - Users');
    console.log('  - Profiles (includes Cloudinary URLs)');
    console.log('  - Settings');
    console.log('  - PendingRegistrations');

    console.log('\n📋 Next steps:');
    console.log('  1. Open data.xlsx to verify your data');
    console.log('  2. Delete old files: users.xlsx, profiles.xlsx, settings.xlsx, pending_registrations.xlsx');
    console.log('  3. Restart your application');
}

// Run migration
migrateToSingleFile();
