import { MESSAGES } from "./i18n.generated";

export { MESSAGES };

export type MessageKey = keyof typeof MESSAGES.en;

function getFallbackLocale(): keyof typeof MESSAGES {
  return navigator.language.toLowerCase().startsWith("zh") ? "zh_CN" : "en";
}

export function getMessage(key: MessageKey): string {
  const chromeMessage = globalThis.chrome?.i18n?.getMessage(key);

  if (chromeMessage) {
    return chromeMessage;
  }

  return MESSAGES[getFallbackLocale()][key] ?? MESSAGES.en[key];
}
