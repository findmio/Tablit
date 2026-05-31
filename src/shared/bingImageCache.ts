const BING_IMAGE_ORIGIN = "https://www.bing.com";

export type StoredBingImageCache = {
  fetchedDate: string;
  imageUrl: string;
  title?: string;
  copyright?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeBingImageUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmed, BING_IMAGE_ORIGIN);

    if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "www.bing.com") {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function sanitizeBingImageCache(value: unknown): StoredBingImageCache | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.fetchedDate !== "string" || typeof value.imageUrl !== "string") {
    return null;
  }

  const imageUrl = normalizeBingImageUrl(value.imageUrl);

  if (!imageUrl) {
    return null;
  }

  const cache: StoredBingImageCache = {
    fetchedDate: value.fetchedDate,
    imageUrl,
  };

  if (typeof value.title === "string") {
    cache.title = value.title;
  }

  if (typeof value.copyright === "string") {
    cache.copyright = value.copyright;
  }

  return cache;
}
