import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MESSAGES } from "./i18n.generated";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf-8")) as T;
}

type Manifest = {
  default_locale?: string;
  name: string;
  description: string;
  icons?: Record<string, string>;
};

type LocaleMessages = Record<string, { message: string }>;

describe("extension manifest i18n", () => {
  it("uses Chrome extension message placeholders in the manifest", () => {
    const manifest = readJson<Manifest>("public/manifest.json");

    expect(manifest.default_locale).toBe("en");
    expect(manifest.name).toBe("__MSG_extName__");
    expect(manifest.description).toBe("__MSG_extDescription__");
  });

  it("declares extension icon assets that exist in public", () => {
    const manifest = readJson<Manifest>("public/manifest.json");

    expect(manifest.icons).toEqual({
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    });

    for (const iconPath of Object.values(manifest.icons ?? {})) {
      expect(existsSync(resolve(process.cwd(), "public", iconPath))).toBe(true);
    }
  });

  it("provides English and Simplified Chinese locale messages", () => {
    const english = readJson<LocaleMessages>(
      "public/_locales/en/messages.json",
    );
    const chinese = readJson<LocaleMessages>(
      "public/_locales/zh_CN/messages.json",
    );

    expect(english.extName.message).toBe("Tablite");
    expect(english.extDescription.message).toBe(
      "Minimal new tab, focused on search, lightweight and calm.",
    );
    expect(chinese.extName.message).toBe("Tablite");
    expect(chinese.extDescription.message).toBe(
      "极简标签页，专注搜索，轻量安静。",
    );
  });

  it("keeps extension locale files aligned with development fallback messages", () => {
    const english = readJson<LocaleMessages>(
      "public/_locales/en/messages.json",
    );
    const chinese = readJson<LocaleMessages>(
      "public/_locales/zh_CN/messages.json",
    );

    expect(Object.keys(english).sort()).toEqual(Object.keys(MESSAGES.en).sort());
    expect(Object.keys(chinese).sort()).toEqual(
      Object.keys(MESSAGES.zh_CN).sort(),
    );

    for (const [key, value] of Object.entries(MESSAGES.en)) {
      expect(english[key].message).toBe(value);
    }

    for (const [key, value] of Object.entries(MESSAGES.zh_CN)) {
      expect(chinese[key].message).toBe(value);
    }
  });

  it("keeps runtime i18n free of hand-written fallback messages", () => {
    const runtimeAdapter = readFileSync(
      resolve(process.cwd(), "src/shared/i18n.ts"),
      "utf-8",
    );

    expect(runtimeAdapter).toContain("./i18n.generated");
    expect(runtimeAdapter).not.toContain("export const MESSAGES = {");
    expect(runtimeAdapter).not.toContain("Minimal new tab");
    expect(runtimeAdapter).not.toContain("极简标签页");
  });

  it("includes the locale generation script used by package lifecycle hooks", () => {
    const packageJson = readJson<{
      scripts: Record<string, string>;
    }>("package.json");

    expect(existsSync(resolve(process.cwd(), "scripts/generate-i18n.mjs"))).toBe(
      true,
    );
    expect(packageJson.scripts.predev).toBe("node scripts/generate-i18n.mjs");
    expect(packageJson.scripts.prebuild).toBe("node scripts/generate-i18n.mjs");
    expect(packageJson.scripts.pretest).toBe("node scripts/generate-i18n.mjs");
    expect(packageJson.scripts["pretest:watch"]).toBe(
      "node scripts/generate-i18n.mjs",
    );
  });
});
