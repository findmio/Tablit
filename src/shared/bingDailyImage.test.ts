import { describe, expect, it, vi } from "vitest";
import {
  fetchBingDailyImage,
  getBingDateKey,
  isFreshBingCache,
  parseBingImageResponse,
} from "./bingDailyImage";

describe("Bing daily image logic", () => {
  it("formats the Bing date key in Pacific time", () => {
    expect(getBingDateKey(new Date("2026-05-31T06:30:00.000Z"))).toBe(
      "2026-05-30",
    );
  });

  it("accounts for Pacific daylight saving time", () => {
    expect(getBingDateKey(new Date("2026-01-01T07:30:00.000Z"))).toBe(
      "2025-12-31",
    );
    expect(getBingDateKey(new Date("2026-07-01T06:30:00.000Z"))).toBe(
      "2026-06-30",
    );
  });

  it("treats same-day cache as fresh", () => {
    expect(
      isFreshBingCache(
        {
          fetchedDate: "2026-05-30",
          imageUrl: "https://www.bing.com/example.jpg",
        },
        "2026-05-30",
      ),
    ).toBe(true);
  });

  it("treats stale cache as not fresh", () => {
    expect(
      isFreshBingCache(
        {
          fetchedDate: "2026-05-29",
          imageUrl: "https://www.bing.com/example.jpg",
        },
        "2026-05-30",
      ),
    ).toBe(false);
  });

  it("parses Bing image metadata", () => {
    expect(
      parseBingImageResponse(
        {
          images: [
            {
              url: "/th?id=OHR.Example.jpg&pid=hp",
              title: "Example title",
              copyright: "Example copyright",
            },
          ],
        },
        "2026-05-30",
      ),
    ).toEqual({
      fetchedDate: "2026-05-30",
      imageUrl: "https://www.bing.com/th?id=OHR.Example.jpg&pid=hp",
      title: "Example title",
      copyright: "Example copyright",
    });
  });

  it("returns null for malformed Bing metadata", () => {
    expect(parseBingImageResponse({ images: [] }, "2026-05-30")).toBeNull();
  });

  it.each([
    null,
    undefined,
    "not an object",
    { images: null },
    { images: [null] },
    { images: [{ url: "" }] },
  ])("returns null for malformed Bing payload %#", (payload) => {
    expect(parseBingImageResponse(payload, "2026-05-30")).toBeNull();
  });

  it.each([
    "//example.com/image.jpg",
    "https://example.com/image.jpg",
    "http://www.bing.com/image.jpg",
    "javascript:alert(1)",
  ])("rejects unsafe or non-Bing image URL %s", (url) => {
    expect(
      parseBingImageResponse(
        {
          images: [
            {
              url,
            },
          ],
        },
        "2026-05-30",
      ),
    ).toBeNull();
  });

  it("omits optional metadata when it is not a string", () => {
    expect(
      parseBingImageResponse(
        {
          images: [
            {
              url: "/th?id=OHR.Example.jpg&pid=hp",
              title: 42,
              copyright: false,
            },
          ],
        },
        "2026-05-30",
      ),
    ).toEqual({
      fetchedDate: "2026-05-30",
      imageUrl: "https://www.bing.com/th?id=OHR.Example.jpg&pid=hp",
    });
  });

  it("returns null when the Bing fetch fails", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    await expect(fetchBingDailyImage(fetcher, "2026-05-30")).resolves.toBeNull();
  });

  it("returns null when the Bing response JSON cannot be read", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error("invalid json")),
    });

    await expect(fetchBingDailyImage(fetcher, "2026-05-30")).resolves.toBeNull();
  });

  it("returns null when the Bing response payload is malformed or unsafe", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        images: [
          {
            url: "https://example.com/image.jpg",
          },
        ],
      }),
    });

    await expect(fetchBingDailyImage(fetcher, "2026-05-30")).resolves.toBeNull();
  });
});
