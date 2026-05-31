import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  getActiveSearchEngine,
  type SearchSettings,
} from "../../shared/searchEngines";
import { getMessage } from "../../shared/i18n";
import { EngineMenu } from "./EngineMenu";

type SearchBoxProps = {
  settings: SearchSettings;
  onSettingsChange: (settings: SearchSettings) => void;
  onSearch: (query: string) => void;
  searchDisabled?: boolean;
};

export function SearchBox({
  settings,
  onSettingsChange,
  onSearch,
  searchDisabled = false,
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const activeEngine = useMemo(() => getActiveSearchEngine(settings), [settings]);
  const activeEngineLabel =
    activeEngine.id === "custom" ? getMessage("customEngineLabel") : activeEngine.label;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        rootRef.current?.contains(event.target)
      ) {
        return;
      }

      setMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
    };
  }, [menuOpen]);

  function submitQuery() {
    if (searchDisabled) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    onSearch(trimmed);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuery();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    submitQuery();
  }

  return (
    <div className="relative" ref={rootRef}>
      <form
        className="flex min-h-[54px] items-center gap-2 rounded-full border border-white/40 bg-white/90 py-2 pr-3 pl-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-[18px] sm:min-h-[58px] sm:gap-3 sm:pr-4"
        onSubmit={submitSearch}
      >
        <button
          type="button"
          className="min-h-9 min-w-[76px] rounded-full border-0 bg-slate-900/8 px-3 font-bold text-[#1d2936] transition-colors hover:bg-slate-900/14 focus-visible:bg-slate-900/14 disabled:bg-slate-900/5 disabled:text-[#1d2936]/60 sm:min-h-10 sm:min-w-[86px]"
          ref={chipRef}
          aria-haspopup="dialog"
          aria-controls={menuOpen ? menuId : undefined}
          aria-expanded={menuOpen}
          disabled={searchDisabled}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {activeEngineLabel}
        </button>
        <input
          aria-label={getMessage("searchInputLabel")}
          className="w-full min-w-0 border-0 bg-transparent text-base text-[#121923] outline-0 placeholder:text-[#121923]/50 disabled:placeholder:text-[#121923]/35 sm:text-lg"
          value={query}
          autoFocus
          autoComplete="off"
          disabled={searchDisabled}
          placeholder={getMessage("searchPlaceholder")}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setMenuOpen(false)}
          onPointerDown={() => setMenuOpen(false)}
          onKeyDown={handleSearchKeyDown}
        />
      </form>
      {menuOpen ? (
        <EngineMenu
          id={menuId}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setMenuOpen(false)}
          onEscapeClose={() => {
            setMenuOpen(false);
            chipRef.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
