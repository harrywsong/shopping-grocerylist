import fs from "fs";
import path from "path";

export interface AppSettings {
  favouriteStores: string[];
}

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
      return JSON.parse(raw) as AppSettings;
    }
  } catch {
    // fall through to default
  }
  return { favouriteStores: [] };
}

export function saveSettings(settings: AppSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
