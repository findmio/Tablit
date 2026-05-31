import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  SEARCH_ENGINES,
  type SearchSettings,
} from "../../shared/searchEngines";
import { getMessage } from "../../shared/i18n";
import { validateSearchTemplate } from "../../shared/urlTemplate";

type EngineMenuProps = {
  id: string;
  settings: SearchSettings;
  onSettingsChange: (settings: SearchSettings) => void;
  onClose: () => void;
  onEscapeClose: () => void;
};

export function EngineMenu({
  id,
  settings,
  onSettingsChange,
  onClose,
  onEscapeClose,
}: EngineMenuProps) {
  const [customValue, setCustomValue] = useState(settings.customTemplate ?? "");
  const [error, setError] = useState<string | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const errorId = `${id}-custom-error`;

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onEscapeClose();
    }
  }

  function handleCustomInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    saveCustom();
  }

  function selectBuiltIn(activeEngineId: "google" | "baidu") {
    onSettingsChange({
      activeEngineId,
      customTemplate: settings.customTemplate,
    });
    onClose();
  }

  function saveCustom() {
    const validation = validateSearchTemplate(customValue);

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    onSettingsChange({
      activeEngineId: "custom",
      customTemplate: customValue.trim(),
    });
    onClose();
  }

  function submitCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCustom();
  }

  return (
    <div
      className="absolute top-[calc(100%+12px)] left-0 grid w-full max-w-[360px] gap-2 rounded-2xl border border-white/50 bg-white/95 p-2.5 text-[#1d2936] shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-[18px]"
      id={id}
      role="dialog"
      aria-label={getMessage("searchEngineOptionsLabel")}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="min-h-[38px] w-full rounded-[10px] border-0 bg-slate-900/7 px-3 text-left text-[#1d2936] hover:bg-slate-900/13 focus-visible:bg-slate-900/13"
        ref={firstButtonRef}
        onClick={() => selectBuiltIn("google")}
      >
        {SEARCH_ENGINES.google.label}
      </button>
      <button
        type="button"
        className="min-h-[38px] w-full rounded-[10px] border-0 bg-slate-900/7 px-3 text-left text-[#1d2936] hover:bg-slate-900/13 focus-visible:bg-slate-900/13"
        onClick={() => selectBuiltIn("baidu")}
      >
        {SEARCH_ENGINES.baidu.label}
      </button>
      <form className="grid gap-2" onSubmit={submitCustom}>
        <button
          type="button"
          className="min-h-[38px] w-full rounded-[10px] border-0 bg-slate-900/7 px-3 text-left text-[#1d2936] hover:bg-slate-900/13 focus-visible:bg-slate-900/13"
          onClick={() => {
            setError(null);
            customInputRef.current?.focus();
          }}
        >
          {getMessage("customEngineLabel")}
        </button>
        <label className="grid gap-1.5 text-xs text-[#1d2936]/70">
          <span>{getMessage("customSearchUrlLabel")}</span>
          <input
            aria-label={getMessage("customSearchUrlLabel")}
            className="min-h-[38px] w-full rounded-[10px] border-0 bg-slate-900/7 px-3 text-[#1d2936]"
            ref={customInputRef}
            value={customValue}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            placeholder="https://example.com/search?q=%s"
            onChange={(event) => {
              setCustomValue(event.target.value);
              setError(null);
            }}
            onKeyDown={handleCustomInputKeyDown}
          />
        </label>
        {error ? (
          <p className="m-0 text-xs leading-[1.4] text-[#a23b3b]" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="min-h-[38px] w-full rounded-[10px] border-0 bg-slate-900/7 px-3 text-center font-bold text-[#1d2936] hover:bg-slate-900/13 focus-visible:bg-slate-900/13"
        >
          {getMessage("saveCustomEngineLabel")}
        </button>
      </form>
    </div>
  );
}
