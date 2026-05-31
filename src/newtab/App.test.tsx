import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

vi.mock("../shared/storage", () => ({
  loadSearchSettings: vi.fn(),
  saveSearchSettings: vi.fn(),
  loadBingImageCache: vi.fn(),
  saveBingImageCache: vi.fn(),
}));

vi.mock("../shared/bingDailyImage", async () => {
  const actual = await vi.importActual<typeof import("../shared/bingDailyImage")>(
    "../shared/bingDailyImage",
  );

  return {
    ...actual,
    fetchBingDailyImage: vi.fn(),
    getBingDateKey: vi.fn(() => "2026-05-30"),
  };
});

import { fetchBingDailyImage } from "../shared/bingDailyImage";
import {
  loadBingImageCache,
  loadSearchSettings,
  saveBingImageCache,
  saveSearchSettings,
} from "../shared/storage";

function getBackgroundElement() {
  return document.querySelector('[aria-hidden="true"]') as HTMLElement | null;
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadSearchSettings).mockResolvedValue({
      activeEngineId: "baidu",
      customTemplate: null,
    });
    vi.mocked(loadBingImageCache).mockResolvedValue({
      fetchedDate: "2026-05-30",
      imageUrl: "https://www.bing.com/cached.jpg",
    });
    vi.mocked(fetchBingDailyImage).mockResolvedValue(null);
    vi.mocked(saveBingImageCache).mockResolvedValue();
    vi.mocked(saveSearchSettings).mockResolvedValue();
  });

  it("renders the search box with stored settings", async () => {
    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Baidu" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Search query")).toBeInTheDocument();
  });

  it("keeps search controls disabled until stored settings finish loading", async () => {
    const settingsLoad = deferred<{
      activeEngineId: "baidu";
      customTemplate: null;
    }>();
    vi.mocked(loadSearchSettings).mockReturnValue(settingsLoad.promise);

    render(<App />);

    expect(screen.getByLabelText("Search query")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Google" })).toBeDisabled();

    settingsLoad.resolve({
      activeEngineId: "baidu",
      customTemplate: null,
    });

    expect(await screen.findByRole("button", { name: "Baidu" })).toBeEnabled();
    expect(screen.getByLabelText("Search query")).toBeEnabled();
  });

  it("uses fresh cached Bing image without requesting a new one", async () => {
    render(<App />);

    await screen.findByRole("button", { name: "Baidu" });

    await waitFor(() => {
      expect(fetchBingDailyImage).not.toHaveBeenCalled();
    });

    const background = getBackgroundElement();

    expect(background).not.toBeNull();
    expect(background?.style.backgroundImage).toContain(
      "https://www.bing.com/cached.jpg",
    );
  });

  it("renders the default Google search box when loading settings fails", async () => {
    vi.mocked(loadSearchSettings).mockRejectedValue(new Error("settings failed"));

    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Google" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Search query")).toBeInTheDocument();
  });

  it("renders the search box when loading the cached Bing image fails", async () => {
    vi.mocked(loadSearchSettings).mockResolvedValue({
      activeEngineId: "google",
      customTemplate: null,
    });
    vi.mocked(loadBingImageCache).mockRejectedValue(new Error("cache failed"));

    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Google" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Search query")).toBeInTheDocument();
  });

  it("refreshes a missing Bing cache and saves the refreshed background", async () => {
    vi.mocked(loadSearchSettings).mockResolvedValue({
      activeEngineId: "google",
      customTemplate: null,
    });
    vi.mocked(loadBingImageCache).mockResolvedValue(null);
    vi.mocked(fetchBingDailyImage).mockResolvedValue({
      fetchedDate: "2026-05-30",
      imageUrl: "https://www.bing.com/fresh.jpg",
    });

    render(<App />);

    await waitFor(() => {
      expect(getBackgroundElement()?.style.backgroundImage).toContain(
        "https://www.bing.com/fresh.jpg",
      );
    });

    expect(fetchBingDailyImage).toHaveBeenCalledTimes(1);
    expect(saveBingImageCache).toHaveBeenCalledWith({
      fetchedDate: "2026-05-30",
      imageUrl: "https://www.bing.com/fresh.jpg",
    });
  });

  it("keeps the refreshed background when saving the Bing cache fails", async () => {
    vi.mocked(loadBingImageCache).mockResolvedValue(null);
    vi.mocked(fetchBingDailyImage).mockResolvedValue({
      fetchedDate: "2026-05-30",
      imageUrl: "https://www.bing.com/fresh.jpg",
    });
    vi.mocked(saveBingImageCache).mockRejectedValue(new Error("save failed"));

    render(<App />);

    await waitFor(() => {
      const background = getBackgroundElement();

      expect(background).not.toBeNull();
      expect(background?.style.backgroundImage).toContain(
        "https://www.bing.com/fresh.jpg",
      );
    });
  });

  it("does not render an unsafe cached Bing image URL as a background image", async () => {
    vi.mocked(loadBingImageCache).mockResolvedValue({
      fetchedDate: "2026-05-30",
      imageUrl: "https://example.com/cached.jpg",
    });

    render(<App />);

    await screen.findByRole("button", { name: "Baidu" });

    const background = getBackgroundElement();
    expect(background?.style.backgroundImage).not.toContain("example.com");
  });

  it("saves selected built-in search settings and updates the active engine chip", async () => {
    const user = userEvent.setup();
    vi.mocked(loadSearchSettings).mockResolvedValue({
      activeEngineId: "google",
      customTemplate: null,
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Baidu" }));

    expect(
      await screen.findByRole("button", { name: "Baidu" }),
    ).toBeInTheDocument();
    expect(saveSearchSettings).toHaveBeenCalledWith({
      activeEngineId: "baidu",
      customTemplate: null,
    });
  });

  it("updates the active engine chip when saving search settings fails", async () => {
    const user = userEvent.setup();
    vi.mocked(loadSearchSettings).mockResolvedValue({
      activeEngineId: "google",
      customTemplate: null,
    });
    vi.mocked(saveSearchSettings).mockRejectedValue(new Error("save failed"));

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Baidu" }));

    expect(
      await screen.findByRole("button", { name: "Baidu" }),
    ).toBeInTheDocument();
  });
});
