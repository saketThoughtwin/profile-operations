import { readExcel, writeExcel } from './excel';

interface Settings {
    twilioEnabled: boolean;
    registrationOpen: boolean;
    registrationStartDate: string;
    registrationEndDate: string;
}

const SETTINGS_FILE = 'settings.xlsx';

const DEFAULT_SETTINGS: Settings = {
    twilioEnabled: false, // Default to disabled
    registrationOpen: true,
    registrationStartDate: '',
    registrationEndDate: '',
};

/**
 * Get current settings
 */
export const getSettings = async (): Promise<Settings> => {
    try {
        const data = await readExcel(SETTINGS_FILE);
        if (data.length === 0) {
            // Initialize with defaults
            await initializeSettings();
            return DEFAULT_SETTINGS;
        }

        // Convert array of key-value pairs to Settings object
        const settings: any = {};
        data.forEach((row: any) => {
            if (row.key === 'twilioEnabled') {
                settings.twilioEnabled = row.value === 'true' || row.value === true;
            } else if (row.key === 'registrationOpen') {
                settings.registrationOpen = row.value === 'true' || row.value === true;
            } else if (row.key === 'registrationStartDate') {
                settings.registrationStartDate = row.value;
            } else if (row.key === 'registrationEndDate') {
                settings.registrationEndDate = row.value;
            }
        });

        return { ...DEFAULT_SETTINGS, ...settings };
    } catch (error) {
        console.error('Error reading settings:', error);
        initializeSettings();
        return DEFAULT_SETTINGS;
    }
};

/**
 * Update settings
 */
export const updateSettings = async (settings: Partial<Settings>): Promise<void> => {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };

    // Convert to array of key-value pairs
    const data = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value: String(value),
    }));

    writeExcel(SETTINGS_FILE, data);
};

/**
 * Initialize settings file with defaults
 */
const initializeSettings = async (): Promise<void> => {
    const data = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        key,
        value: String(value),
    }));
    await writeExcel(SETTINGS_FILE, data);
};

/**
 * Check if Twilio is enabled
 */
export const isTwilioEnabled = async (): Promise<boolean> => {
    const settings = await getSettings();
    return settings.twilioEnabled;
};
