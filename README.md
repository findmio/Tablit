# Tablite

极简标签页，专注搜索，轻量安静。安全、无追踪，开箱即用。

Tablite 是一个面向 Chromium 浏览器的 Manifest V3 新标签页扩展。它把新标签页变成一个干净的搜索入口：只有搜索框，背景使用必应每日一图，搜索引擎可以在 Google、Baidu 和自定义 URL 模板之间切换。它不接入分析、广告或遥测服务，设置保存在浏览器本地，默认配置开箱即用。

> English version: [README.en.md](README.en.md)

## 功能特性

- 极简新标签页：没有时钟、卡片、待办、资讯流或其它干扰元素。
- 安全克制：基于 Manifest V3，仅请求本地存储和获取必应每日一图所需的权限。
- 无追踪：不包含分析埋点、遥测、广告脚本或远程配置。
- 开箱即用：安装后立即得到可用的搜索页、默认搜索引擎和每日背景。
- 搜索框内设置：搜索引擎选择和自定义搜索 URL 都融合在搜索框里。
- 内置搜索引擎：预设 Google 和 Baidu。
- 自定义搜索引擎：支持使用 `%s` 作为搜索词占位符，例如 `https://example.com/search?q=%s`。
- 必应每日一图：自动获取并缓存 Bing daily image，网络失败时优雅降级。
- 多语言：使用 Chrome 官方 i18n 机制，当前支持 English 和简体中文。
- 现代前端栈：React、Vite、TypeScript、Tailwind CSS。

## 截图

![Tablite screenshot](docs/screenshot.png)

## 从应用商店安装

- [Chrome Web Store](https://chromewebstore.google.com/detail/tablite/idjjaindppamhdcdefngfohdpkeokbnn)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/nijfmkndoanecmjohipkeagmbpcfejde)

## 从源码安装到浏览器

1. 安装依赖：

```bash
npm install
```

2. 构建扩展：

```bash
npm run build
```

3. 在 Chromium 浏览器中加载：

- 打开 `chrome://extensions/`
- 开启 Developer mode
- 点击 Load unpacked
- 选择项目里的 `dist/` 目录

安装后，新标签页会被 Tablite 替换。

## 安全与隐私

- 最小权限：扩展只声明 `storage` 权限，以及用于加载 Bing daily image 的 `https://www.bing.com/*` 访问权限。
- 本地保存：搜索引擎偏好、自定义搜索 URL 和背景缓存保存在浏览器本地存储中。
- 无追踪设计：Tablite 不收集搜索记录、浏览记录或使用统计，也不向分析、广告或遥测平台发送数据。
- 网络请求清晰：除自动获取必应每日一图，以及你主动提交搜索时打开对应搜索引擎外，Tablite 不连接额外服务。

## 本地开发

```bash
npm run dev
```

开发服务器默认运行在：

```text
http://127.0.0.1:5173/
```

常用命令：

```bash
npm run dev       # 启动 Vite 开发服务器
npm run build     # 生成 dist 扩展包
npm test          # 运行测试
npm run preview   # 预览生产构建
```

项目要求 Node.js `20.19+`、`22.13+` 或 `24+`。

## 多语言文案

Tablite 使用 Chrome 官方扩展国际化机制。文案源只维护一份：

```text
public/_locales/en/messages.json
public/_locales/zh_CN/messages.json
```

开发和测试环境会在运行前自动生成 fallback 文件：

```text
src/shared/i18n.generated.ts
```

这个文件由 `scripts/generate-i18n.mjs` 生成，并已加入 `.gitignore`。修改文案时，只需要改 `_locales` 里的 `messages.json`。

## 项目结构

```text
public/
  manifest.json
  _locales/
src/
  newtab/
    App.tsx
    main.tsx
    styles.css
    components/
  shared/
scripts/
  generate-i18n.mjs
```

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS
- Vitest
- Chrome Extension Manifest V3

## License

MIT License
