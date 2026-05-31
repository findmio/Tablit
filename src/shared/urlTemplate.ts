import { getMessage } from "./i18n";

export type TemplateValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const QUERY_TOKEN = "%s";

export function validateSearchTemplate(
  template: string,
): TemplateValidationResult {
  const trimmed = template.trim();

  if (!trimmed.includes(QUERY_TOKEN)) {
    return {
      valid: false,
      message: getMessage("searchTemplateMissingToken"),
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.replaceAll(QUERY_TOKEN, "test"));
  } catch {
    return {
      valid: false,
      message: getMessage("searchTemplateInvalidUrl"),
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      message: getMessage("searchTemplateUnsupportedProtocol"),
    };
  }

  return { valid: true };
}

export function buildSearchUrl(template: string, query: string): string {
  return template.trim().split(QUERY_TOKEN).join(encodeURIComponent(query));
}
