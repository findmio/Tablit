import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SEARCH_SETTINGS,
  getActiveSearchEngine,
  normalizeSearchSettings,
  SEARCH_ENGINES,
} from "./searchEngines";
import { buildSearchUrl, validateSearchTemplate } from "./urlTemplate";

describe("search engine domain logic", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds an encoded Google search URL", () => {
    const url = buildSearchUrl(SEARCH_ENGINES.google.template, "react vite 插件");
    expect(url).toBe(
      "https://www.google.com/search?q=react%20vite%20%E6%8F%92%E4%BB%B6",
    );
  });

  it("builds an encoded Baidu search URL", () => {
    const url = buildSearchUrl(SEARCH_ENGINES.baidu.template, "极简 标签页");
    expect(url).toBe(
      "https://www.baidu.com/s?wd=%E6%9E%81%E7%AE%80%20%E6%A0%87%E7%AD%BE%E9%A1%B5",
    );
  });

  it("replaces every query token in a custom template", () => {
    expect(buildSearchUrl("https://example.com/%s?q=%s", "a b")).toBe(
      "https://example.com/a%20b?q=a%20b",
    );
  });

  it("rejects a custom template without the query token", () => {
    expect(validateSearchTemplate("https://example.com/search")).toEqual({
      valid: false,
      message: "URL must include %s where the search query should go.",
    });
  });

  it("returns localized Chinese validation feedback", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("zh-CN");

    expect(validateSearchTemplate("https://example.com/search")).toEqual({
      valid: false,
      message: "URL 必须包含 %s，用来放置搜索内容。",
    });
  });

  it("rejects non-http custom templates", () => {
    expect(validateSearchTemplate("javascript:alert(%s)")).toEqual({
      valid: false,
      message: "URL must start with http:// or https://.",
    });
  });

  it("accepts an http custom template with the query token", () => {
    expect(validateSearchTemplate("https://example.com/search?q=%s")).toEqual({
      valid: true,
    });
  });

  it("normalizes malformed settings to defaults", () => {
    const normalized = normalizeSearchSettings({ activeEngineId: "unknown" });

    expect(normalized).toEqual(DEFAULT_SEARCH_SETTINGS);
    expect(normalized).not.toBe(DEFAULT_SEARCH_SETTINGS);
  });

  it("preserves a valid custom template with a built-in active engine", () => {
    expect(
      normalizeSearchSettings({
        activeEngineId: "baidu",
        customTemplate: "https://example.com/search?q=%s",
      }),
    ).toEqual({
      activeEngineId: "baidu",
      customTemplate: "https://example.com/search?q=%s",
    });
  });

  it("falls back to a fresh Google default for invalid custom settings", () => {
    const normalized = normalizeSearchSettings({
      activeEngineId: "custom",
      customTemplate: "javascript:alert(%s)",
    });

    expect(normalized).toEqual(DEFAULT_SEARCH_SETTINGS);
    expect(normalized).not.toBe(DEFAULT_SEARCH_SETTINGS);
  });

  it("resolves custom engine when a valid custom template is active", () => {
    const engine = getActiveSearchEngine({
      activeEngineId: "custom",
      customTemplate: "https://example.com/search?q=%s",
    });

    expect(engine).toEqual({
      id: "custom",
      label: "Custom",
      template: "https://example.com/search?q=%s",
    });
  });

  it("falls back to Google when custom is active without a valid template", () => {
    const engine = getActiveSearchEngine({
      activeEngineId: "custom",
      customTemplate: null,
    });

    expect(engine).toEqual(SEARCH_ENGINES.google);
  });
});
