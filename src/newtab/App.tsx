import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBingDailyImage,
  getBingDateKey,
  isFreshBingCache,
  type BingImageCache,
} from "../shared/bingDailyImage";
import {
  DEFAULT_SEARCH_SETTINGS,
  getActiveSearchEngine,
  type SearchSettings,
} from "../shared/searchEngines";
import {
  loadBingImageCache,
  loadSearchSettings,
  saveBingImageCache,
  saveSearchSettings,
} from "../shared/storage";
import { getMessage } from "../shared/i18n";
import { buildSearchUrl } from "../shared/urlTemplate";
import { Background } from "./components/Background";
import { SearchBox } from "./components/SearchBox";

export default function App() {
  const [settings, setSettings] = useState<SearchSettings>(DEFAULT_SEARCH_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [background, setBackground] = useState<BingImageCache | null>(null);
  const settingsTouchedRef = useRef(false);
  const activeEngine = useMemo(() => getActiveSearchEngine(settings), [settings]);

  useEffect(() => {
    let cancelled = false;

    async function loadStoredSettings() {
      try {
        const storedSettings = await loadSearchSettings();

        if (!cancelled && !settingsTouchedRef.current) {
          setSettings(storedSettings);
        }
      } catch {
        // Defaults stay active when storage is unavailable.
      } finally {
        if (!cancelled) {
          setSettingsReady(true);
        }
      }
    }

    async function loadBackground() {
      let cachedBackground: BingImageCache | null = null;

      try {
        cachedBackground = await loadBingImageCache();
      } catch {
        cachedBackground = null;
      }

      if (cancelled) {
        return;
      }

      setBackground(cachedBackground);

      if (isFreshBingCache(cachedBackground, getBingDateKey())) {
        return;
      }

      let refreshedBackground: BingImageCache | null = null;

      try {
        refreshedBackground = await fetchBingDailyImage();
      } catch {
        refreshedBackground = null;
      }

      if (!cancelled && refreshedBackground) {
        setBackground(refreshedBackground);
        try {
          await saveBingImageCache(refreshedBackground);
        } catch {
          // Keep the visible refresh even if persistence is unavailable.
        }
      }
    }

    void loadStoredSettings();
    void loadBackground();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateSettings(nextSettings: SearchSettings) {
    settingsTouchedRef.current = true;
    setSettings(nextSettings);

    try {
      await saveSearchSettings(nextSettings);
    } catch {
      // The optimistic UI state remains useful even if storage is unavailable.
    }
  }

  function search(query: string) {
    if (!settingsReady) {
      return;
    }

    window.location.href = buildSearchUrl(activeEngine.template, query);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,rgba(13,18,25,0.08),rgba(13,18,25,0.42)),linear-gradient(135deg,#263847_0%,#476b74_48%,#b9966c_100%)] p-[18px] sm:p-6">
      <Background image={background} />
      <section
        className="relative z-10 w-full max-w-[680px]"
        aria-label={getMessage("searchStageLabel")}
      >
        <SearchBox
          settings={settings}
          onSettingsChange={(nextSettings) => {
            void updateSettings(nextSettings);
          }}
          onSearch={search}
          searchDisabled={!settingsReady}
        />
      </section>
    </main>
  );
}
