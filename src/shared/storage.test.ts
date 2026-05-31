import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SEARCH_SETTINGS } from "./searchEngines";
import {
  loadBingImageCache,
  loadSearchSettings,
  saveBingImageCache,
  saveSearchSettings,
} from "./storage";

const SEARCH_SETTINGS_KEY = "tablite.searchSettings";
const BING_IMAGE_CACHE_KEY = "tablite.bingImageCache";

type FakeLastError = { message?: string };
type FakeRuntime = { lastError?: FakeLastError };
type FakeGetCallback = (items?: Record<string, unknown>) => void;
type FakeSetCallback = () => void;
type FakeChromeStorageArea = {
  get: (keys: string[] | string, callback: FakeGetCallback) => void;
  set: (items: Record<string, unknown>, callback?: FakeSetCallback) => void;
};

function installFakeChromeStorage(area: FakeChromeStorageArea) {
  const fakeChrome = {
    runtime: {} as FakeRuntime,
    storage: {
      local: area,
    },
  };

  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: fakeChrome,
  });

  return fakeChrome;
}

function installMemoryChromeStorage(seed: Record<string, unknown> = {}) {
  const stored = { ...seed };
  const fakeChrome = installFakeChromeStorage({
    get(keys, callback) {
      const requestedKeys = Array.isArray(keys) ? keys : [keys];
      callback(
        requestedKeys.reduce<Record<string, unknown>>((items, key) => {
          if (key in stored) {
            items[key] = stored[key];
          }
          return items;
        }, {}),
      );
    },
    set(items, callback) {
      Object.assign(stored, items);
      callback?.();
    },
  });

  return { fakeChrome, stored };
}

describe("storage adapter", () => {
  beforeEach(() => {
    localStorage.clear();
    Reflect.deleteProperty(globalThis, "chrome");
  });

  it("loads default settings when nothing is stored", async () => {
    await expect(loadSearchSettings()).resolves.toEqual(DEFAULT_SEARCH_SETTINGS);
  });

  it("saves and loads valid settings through localStorage fallback", async () => {
    await saveSearchSettings({
      activeEngineId: "baidu",
      customTemplate: null,
    });

    await expect(loadSearchSettings()).resolves.toEqual({
      activeEngineId: "baidu",
      customTemplate: null,
    });
  });

  it("normalizes malformed stored settings", async () => {
    localStorage.setItem(
      "tablite.searchSettings",
      JSON.stringify({ activeEngineId: "custom", customTemplate: "https://example.com" }),
    );

    await expect(loadSearchSettings()).resolves.toEqual(DEFAULT_SEARCH_SETTINGS);
  });

  it("saves normalized settings through chrome.storage.local when available", async () => {
    const { stored } = installMemoryChromeStorage();

    await saveSearchSettings({
      activeEngineId: "custom",
      customTemplate: "https://example.com",
    });

    expect(stored[SEARCH_SETTINGS_KEY]).toEqual(DEFAULT_SEARCH_SETTINGS);
  });

  it("loads settings from chrome.storage.local when available", async () => {
    installMemoryChromeStorage({
      [SEARCH_SETTINGS_KEY]: {
        activeEngineId: "baidu",
        customTemplate: null,
      },
    });

    await expect(loadSearchSettings()).resolves.toEqual({
      activeEngineId: "baidu",
      customTemplate: null,
    });
  });

  it("loads default settings when chrome.storage.local get omits callback items", async () => {
    installFakeChromeStorage({
      get(_keys, callback) {
        callback(undefined);
      },
      set(_items, callback) {
        callback?.();
      },
    });

    await expect(loadSearchSettings()).resolves.toEqual(DEFAULT_SEARCH_SETTINGS);
  });

  it("rejects chrome.storage.local get errors", async () => {
    const fakeChrome = installFakeChromeStorage({
      get(_keys, callback) {
        fakeChrome.runtime.lastError = { message: "Read failed" };
        callback({});
        Reflect.deleteProperty(fakeChrome.runtime, "lastError");
      },
      set(_items, callback) {
        callback?.();
      },
    });

    await expect(loadSearchSettings()).rejects.toThrow("Read failed");
  });

  it("rejects chrome.storage.local set errors", async () => {
    const fakeChrome = installFakeChromeStorage({
      get(_keys, callback) {
        callback({});
      },
      set(_items, callback) {
        fakeChrome.runtime.lastError = { message: "Write failed" };
        callback?.();
        Reflect.deleteProperty(fakeChrome.runtime, "lastError");
      },
    });

    await expect(saveSearchSettings(DEFAULT_SEARCH_SETTINGS)).rejects.toThrow(
      "Write failed",
    );
  });

  it("saves and loads Bing image cache through localStorage fallback", async () => {
    await saveBingImageCache({
      fetchedDate: "2026-05-31",
      imageUrl: "https://www.bing.com/image.jpg",
      title: "Daily image",
      copyright: "Example",
    });

    await expect(loadBingImageCache()).resolves.toEqual({
      fetchedDate: "2026-05-31",
      imageUrl: "https://www.bing.com/image.jpg",
      title: "Daily image",
      copyright: "Example",
    });
  });

  it("returns null for malformed Bing image cache JSON", async () => {
    localStorage.setItem(BING_IMAGE_CACHE_KEY, "{");

    await expect(loadBingImageCache()).resolves.toBeNull();
  });

  it("returns null when Bing image cache required fields are invalid", async () => {
    localStorage.setItem(
      BING_IMAGE_CACHE_KEY,
      JSON.stringify({
        fetchedDate: "2026-05-31",
        imageUrl: 42,
      }),
    );

    await expect(loadBingImageCache()).resolves.toBeNull();
  });

  it("returns null when cached Bing image URL is unsafe or external", async () => {
    localStorage.setItem(
      BING_IMAGE_CACHE_KEY,
      JSON.stringify({
        fetchedDate: "2026-05-31",
        imageUrl: "https://example.com/image.jpg",
      }),
    );

    await expect(loadBingImageCache()).resolves.toBeNull();
  });

  it("omits invalid Bing image cache optional fields", async () => {
    localStorage.setItem(
      BING_IMAGE_CACHE_KEY,
      JSON.stringify({
        fetchedDate: "2026-05-31",
        imageUrl: "https://www.bing.com/image.jpg",
        title: 42,
        copyright: false,
      }),
    );

    await expect(loadBingImageCache()).resolves.toEqual({
      fetchedDate: "2026-05-31",
      imageUrl: "https://www.bing.com/image.jpg",
    });
  });
});
