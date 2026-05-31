import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SEARCH_SETTINGS } from "../../shared/searchEngines";
import { SearchBox } from "./SearchBox";

describe("SearchBox", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the active search engine chip", () => {
    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();
  });

  it("relates the engine chip to a labeled dialog popover", async () => {
    const user = userEvent.setup();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    const chip = screen.getByRole("button", { name: "Google" });

    expect(chip).toHaveAttribute("aria-haspopup", "dialog");

    await user.click(chip);

    expect(chip).toHaveAttribute("aria-expanded", "true");

    const controlsId = chip.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(
      screen.getByRole("dialog", { name: "Search engine options" }),
    ).toHaveAttribute("id", controlsId);
  });

  it("renders Chinese fallback UI strings for zh browser languages", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator, "language", "get").mockReturnValue("zh-CN");

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("搜索内容")).toHaveAttribute(
      "placeholder",
      "搜索网页",
    );

    await user.click(screen.getByRole("button", { name: "Google" }));

    expect(
      screen.getByRole("dialog", { name: "搜索引擎选项" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "自定义" })).toBeInTheDocument();
    expect(screen.getByLabelText("自定义搜索 URL")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "保存自定义引擎" }),
    ).toBeInTheDocument();
  });

  it("closes the engine dialog on Escape and returns focus to the chip", async () => {
    const user = userEvent.setup();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    const chip = screen.getByRole("button", { name: "Google" });

    await user.click(chip);
    expect(screen.getByRole("button", { name: "Baidu" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("button", { name: "Baidu" }),
    ).not.toBeInTheDocument();
    expect(chip).toHaveFocus();
  });

  it("submits a trimmed query", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={onSearch}
        onSettingsChange={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Search query"), "  vite extension  {Enter}");

    expect(onSearch).toHaveBeenCalledWith("vite extension");
  });

  it("submits when the input receives an Enter keydown", () => {
    const onSearch = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={onSearch}
        onSettingsChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Search query");

    fireEvent.change(input, { target: { value: "  chromium enter  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSearch).toHaveBeenCalledWith("chromium enter");
  });

  it("does not submit or open settings while search is disabled", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={onSearch}
        onSettingsChange={vi.fn()}
        searchDisabled
      />,
    );

    const input = screen.getByLabelText("Search query");
    const chip = screen.getByRole("button", { name: "Google" });

    expect(input).toBeDisabled();
    expect(chip).toBeDisabled();

    fireEvent.change(input, { target: { value: "pending settings" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await user.click(chip);

    expect(onSearch).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: "Search engine options" }),
    ).not.toBeInTheDocument();
  });

  it("ignores empty query submission", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={onSearch}
        onSettingsChange={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Search query"), "   {Enter}");

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("selects Baidu from the engine menu", async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={onSettingsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Baidu" }));

    expect(onSettingsChange).toHaveBeenCalledWith({
      activeEngineId: "baidu",
      customTemplate: null,
    });
  });

  it("focuses the custom URL input from the Custom button", async () => {
    const user = userEvent.setup();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Custom" }));

    expect(screen.getByLabelText("Custom search URL")).toHaveFocus();
  });

  it("closes the engine dialog when the search input receives focus", async () => {
    const user = userEvent.setup();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));

    expect(
      screen.getByRole("dialog", { name: "Search engine options" }),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("Search query"));

    expect(
      screen.queryByRole("dialog", { name: "Search engine options" }),
    ).not.toBeInTheDocument();
  });

  it("closes the engine dialog when clicking an already-focused search input", () => {
    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Search query");

    input.focus();
    fireEvent.click(screen.getByRole("button", { name: "Google" }));

    expect(
      screen.getByRole("dialog", { name: "Search engine options" }),
    ).toBeInTheDocument();

    fireEvent.pointerDown(input);

    expect(
      screen.queryByRole("dialog", { name: "Search engine options" }),
    ).not.toBeInTheDocument();
  });

  it("closes the engine dialog when clicking outside the search box", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <SearchBox
          settings={DEFAULT_SEARCH_SETTINGS}
          onSearch={vi.fn()}
          onSettingsChange={vi.fn()}
        />
        <button type="button">Outside target</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));

    expect(
      screen.getByRole("dialog", { name: "Search engine options" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside target" }));

    expect(
      screen.queryByRole("dialog", { name: "Search engine options" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the engine dialog open when clicking inside the menu", async () => {
    const user = userEvent.setup();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Custom" }));

    expect(
      screen.getByRole("dialog", { name: "Search engine options" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Custom search URL")).toHaveFocus();
  });

  it("validates and saves a custom engine template", async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={onSettingsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Custom" }));
    await user.type(
      screen.getByLabelText("Custom search URL"),
      "https://example.com/search?q=%s",
    );
    await user.click(screen.getByRole("button", { name: "Save custom engine" }));

    expect(onSettingsChange).toHaveBeenCalledWith({
      activeEngineId: "custom",
      customTemplate: "https://example.com/search?q=%s",
    });
  });

  it("saves a custom engine template when pressing Enter in the custom URL input", async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={onSettingsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Custom" }));
    await user.type(
      screen.getByLabelText("Custom search URL"),
      "https://example.com/search?q=%s{Enter}",
    );

    expect(onSettingsChange).toHaveBeenCalledWith({
      activeEngineId: "custom",
      customTemplate: "https://example.com/search?q=%s",
    });
  });

  it("saves a custom engine template from an Enter keydown in the custom URL input", () => {
    const onSettingsChange = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={onSettingsChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Google" }));
    fireEvent.click(screen.getByRole("button", { name: "Custom" }));

    const customInput = screen.getByLabelText("Custom search URL");
    fireEvent.change(customInput, {
      target: { value: "https://example.com/search?q=%s" },
    });
    fireEvent.keyDown(customInput, { key: "Enter" });

    expect(onSettingsChange).toHaveBeenCalledWith({
      activeEngineId: "custom",
      customTemplate: "https://example.com/search?q=%s",
    });
  });

  it("shows validation feedback for an invalid custom template", async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();

    render(
      <SearchBox
        settings={DEFAULT_SEARCH_SETTINGS}
        onSearch={vi.fn()}
        onSettingsChange={onSettingsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "Custom" }));
    const customInput = screen.getByLabelText("Custom search URL");

    await user.type(customInput, "https://example.com/search");
    await user.click(screen.getByRole("button", { name: "Save custom engine" }));

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent(
      "URL must include %s where the search query should go.",
    );
    expect(alert).toHaveAttribute("id");
    expect(customInput).toHaveAttribute("aria-invalid", "true");
    expect(customInput).toHaveAttribute("aria-describedby", alert.id);
    expect(onSettingsChange).not.toHaveBeenCalled();
  });

  it("preserves a saved custom template when selecting a built-in engine", async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();
    const customTemplate = "https://example.com/search?q=%s";

    render(
      <SearchBox
        settings={{
          activeEngineId: "custom",
          customTemplate,
        }}
        onSearch={vi.fn()}
        onSettingsChange={onSettingsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Custom" }));
    await user.click(screen.getByRole("button", { name: "Baidu" }));

    expect(onSettingsChange).toHaveBeenCalledWith({
      activeEngineId: "baidu",
      customTemplate,
    });
  });
});
