import {
  normalizeBingImageUrl,
  type StoredBingImageCache,
} from "./bingImageCache";

const BING_DAILY_IMAGE_ORIGIN = "https://www.bing.com";
const BING_DAILY_IMAGE_ENDPOINT =
  `${BING_DAILY_IMAGE_ORIGIN}/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US`;
const BING_DAILY_IMAGE_TIME_ZONE = "America/Los_Angeles";
const BING_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: BING_DAILY_IMAGE_TIME_ZONE,
  year: "numeric",
});

type BingImageFetcher = (
  input: string,
) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

export type BingImageCache = StoredBingImageCache;

export function getBingDateKey(date = new Date()): string {
  const parts = BING_DATE_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

export function isFreshBingCache(
  cache: BingImageCache | null,
  today = getBingDateKey(),
): boolean {
  return Boolean(cache?.imageUrl && cache.fetchedDate === today);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseBingImageResponse(
  payload: unknown,
  fetchedDate = getBingDateKey(),
): BingImageCache | null {
  if (!isRecord(payload) || !Array.isArray(payload.images)) {
    return null;
  }

  const image = payload.images[0];

  if (!isRecord(image)) {
    return null;
  }

  const rawImageUrl = image.url;

  if (typeof rawImageUrl !== "string" || rawImageUrl.trim() === "") {
    return null;
  }

  const imageUrl = normalizeBingImageUrl(rawImageUrl.trim());

  if (!imageUrl) {
    return null;
  }

  const cache: BingImageCache = {
    fetchedDate,
    imageUrl,
  };

  if (typeof image.title === "string") {
    cache.title = image.title;
  }

  if (typeof image.copyright === "string") {
    cache.copyright = image.copyright;
  }

  return cache;
}

export async function fetchBingDailyImage(
  fetcher: BingImageFetcher = fetch,
  fetchedDate = getBingDateKey(),
): Promise<BingImageCache | null> {
  try {
    const response = await fetcher(BING_DAILY_IMAGE_ENDPOINT);

    if (!response.ok) {
      return null;
    }

    return parseBingImageResponse(await response.json(), fetchedDate);
  } catch {
    return null;
  }
}
