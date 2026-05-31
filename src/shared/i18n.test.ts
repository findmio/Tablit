import { afterEach, describe, expect, it, vi } from "vitest";
import { getMessage } from "./i18n";

function setNavigatorLanguage(language: string) {
  vi.spyOn(navigator, "language", "get").mockReturnValue(language);
}

describe("i18n message adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).chrome;
  });

  it("returns English fallback messages by default", () => {
    setNavigatorLanguage("en-US");

    expect(getMessage("searchPlaceholder")).toBe("Search the web");
  });

  it("returns Chinese fallback messages for zh browser languages", () => {
    setNavigatorLanguage("zh-CN");

    expect(getMessage("searchPlaceholder")).toBe("搜索网页");
  });

  it("prefers chrome.i18n.getMessage when it returns a value", () => {
    setNavigatorLanguage("zh-CN");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = {
      i18n: {
        getMessage: vi.fn((key: string) =>
          key === "searchPlaceholder" ? "Official Chrome message" : "",
        ),
      },
    };

    expect(getMessage("searchPlaceholder")).toBe("Official Chrome message");
  });

  it("falls back when chrome.i18n.getMessage returns an empty string", () => {
    setNavigatorLanguage("zh-CN");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = {
      i18n: {
        getMessage: vi.fn(() => ""),
      },
    };

    expect(getMessage("searchPlaceholder")).toBe("搜索网页");
  });
});
