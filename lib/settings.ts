import { readExcel, writeExcel } from './excel';

interface Settings {
    twilioEnabled: boolean;
}

const SETTINGS_FILE = 'settings.xlsx';

const DEFAULT_SETTINGS: Settings = {
    twilioEnabled: true, // Default to enabled
};

/**
 * Get current settings
 */
export const getSettings = (): Settings => {
    try {
        const data = readExcel(SETTINGS_FILE);
        if (data.length === 0) {
            // Initialize with defaults
            initializeSettings();
            return DEFAULT_SETTINGS;
        }

        // Convert array of key-value pairs to Settings object
        const settings: any = {};
        data.forEach((row: any) => {
            if (row.key === 'twilioEnabled') {
                settings.twilioEnabled = row.value === 'true' || row.value === true;
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
export const updateSettings = (settings: Partial<Settings>): void => {
    const currentSettings = getSettings();
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
const initializeSettings = (): void => {
    const data = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        key,
        value: String(value),
    }));
    writeExcel(SETTINGS_FILE, data);
};

/**
 * Check if Twilio is enabled
 */
export const isTwilioEnabled = (): boolean => {
    return getSettings().twilioEnabled;
};
