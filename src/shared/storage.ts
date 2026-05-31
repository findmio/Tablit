import {
  normalizeSearchSettings,
  type SearchSettings,
} from "./searchEngines";
import {
  sanitizeBingImageCache,
  type StoredBingImageCache,
} from "./bingImageCache";

export type { StoredBingImageCache } from "./bingImageCache";

const SEARCH_SETTINGS_KEY = "tablite.searchSettings";
const BING_IMAGE_CACHE_KEY = "tablite.bingImageCache";

type ChromeStorageArea = {
  get: (
    keys: string[] | string,
    callback: (items?: Record<string, unknown>) => void,
  ) => void;
  set: (items: Record<string, unknown>, callback?: () => void) => void;
};

function getChromeStorageArea(): ChromeStorageArea | null {
  const area = globalThis.chrome?.storage?.local;
  return area ? (area as unknown as ChromeStorageArea) : null;
}

async function readValue<T>(key: string): Promise<T | null> {
  const area = getChromeStorageArea();

  if (area) {
    return new Promise((resolve, reject) => {
      try {
        area.get([key], (items) => {
          const lastError = globalThis.chrome?.runtime?.lastError;
          if (lastError) {
            reject(new Error(lastError.message));
            return;
          }

          resolve((items?.[key] as T | undefined) ?? null);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeValue<T>(key: string, value: T): Promise<void> {
  const area = getChromeStorageArea();

  if (area) {
    await new Promise<void>((resolve, reject) => {
      try {
        area.set({ [key]: value }, () => {
          const lastError = globalThis.chrome?.runtime?.lastError;
          if (lastError) {
            reject(new Error(lastError.message));
            return;
          }

          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadSearchSettings(): Promise<SearchSettings> {
  const stored = await readValue<unknown>(SEARCH_SETTINGS_KEY);
  return stored === null ? normalizeSearchSettings(null) : normalizeSearchSettings(stored);
}

export async function saveSearchSettings(settings: SearchSettings): Promise<void> {
  await writeValue(SEARCH_SETTINGS_KEY, normalizeSearchSettings(settings));
}

export async function loadBingImageCache(): Promise<StoredBingImageCache | null> {
  const stored = await readValue<unknown>(BING_IMAGE_CACHE_KEY);
  return sanitizeBingImageCache(stored);
}

export async function saveBingImageCache(cache: StoredBingImageCache): Promise<void> {
  await writeValue(BING_IMAGE_CACHE_KEY, cache);
}
