import { validateSearchTemplate } from "./urlTemplate";

export type SearchEngineId = "google" | "baidu" | "custom";

export type BuiltInSearchEngineId = Exclude<SearchEngineId, "custom">;

export type SearchEngine = {
  id: SearchEngineId;
  label: string;
  template: string;
};

export type SearchSettings = {
  activeEngineId: SearchEngineId;
  customTemplate: string | null;
};

export const SEARCH_ENGINES: Record<BuiltInSearchEngineId, SearchEngine> = {
  google: {
    id: "google",
    label: "Google",
    template: "https://www.google.com/search?q=%s",
  },
  baidu: {
    id: "baidu",
    label: "Baidu",
    template: "https://www.baidu.com/s?wd=%s",
  },
};

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  activeEngineId: "google",
  customTemplate: null,
};

function createDefaultSearchSettings(): SearchSettings {
  return { ...DEFAULT_SEARCH_SETTINGS };
}

export function normalizeSearchSettings(value: unknown): SearchSettings {
  if (!value || typeof value !== "object") {
    return createDefaultSearchSettings();
  }

  const candidate = value as Partial<SearchSettings>;
  const activeEngineId = candidate.activeEngineId;
  const customTemplate =
    typeof candidate.customTemplate === "string"
      ? candidate.customTemplate
      : null;

  if (activeEngineId === "google" || activeEngineId === "baidu") {
    return {
      activeEngineId,
      customTemplate:
        customTemplate && validateSearchTemplate(customTemplate).valid
          ? customTemplate
          : null,
    };
  }

  if (
    activeEngineId === "custom" &&
    customTemplate &&
    validateSearchTemplate(customTemplate).valid
  ) {
    return {
      activeEngineId: "custom",
      customTemplate,
    };
  }

  return createDefaultSearchSettings();
}

export function getActiveSearchEngine(settings: SearchSettings): SearchEngine {
  if (
    settings.activeEngineId === "custom" &&
    settings.customTemplate &&
    validateSearchTemplate(settings.customTemplate).valid
  ) {
    return {
      id: "custom",
      label: "Custom",
      template: settings.customTemplate,
    };
  }

  if (settings.activeEngineId === "google" || settings.activeEngineId === "baidu") {
    return SEARCH_ENGINES[settings.activeEngineId];
  }

  return SEARCH_ENGINES.google;
}
