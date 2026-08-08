# Codex Dream Skin 深度调研报告

> 仓库：`github.com/Fei-Away/Codex-Dream-Skin`（v1.5.11）
> 调研目标：① 皮肤图片如何与 Codex 客户端"完美贴合"；② 字体颜色 / 字体如何改变
> 结论先行：**贴合靠"生图构图规则 + 运行时图片分析 + CSS 焦点定位与遮罩"三层叠；字体/颜色靠 `theme.json` 调色板（可图像自适应）+ `theme.css` 安全 CSS 两层改。**

---

## 0. 一句话原理

它**不碰官方安装包 / asar / 代码签名**，而是用本机回环 CDP（Chrome DevTools Protocol，只绑 `127.0.0.1`）把一段渲染注入脚本（`renderer-inject.js`）+ 皮肤 CSS（`dream-skin.css`）+ 主题安全 CSS（`theme.css`）注入到 Codex 的真实渲染进程里。贴合与换肤的全部魔法都发生在这三段注入代码里。

核心三段：
- `runtime/renderer-inject.js`（895 行）—— 运行时大脑：分析图片、计算焦点/安全区/主题色、写 CSS 变量、挂 MutationObserver 持续对齐。
- `runtime/dream-skin.css`（1322 行）—— 皮肤本体：用 CSS 变量驱动全部颜色/字体/背景层。
- `runtime/safe-css-policy.json` + `safe-css-validator.mjs` —— 主题作者写 `theme.css` 时的安全沙箱（决定能改字体/颜色到什么程度）。

---

## 1. 整体架构：怎么注入（不动官方包）

`macos/scripts/injector.mjs` 的流程：

1. **发现目标**：请求 `http://127.0.0.1:PORT/json/list`（CDP HTTP 端点），拿到所有 target。
2. **探针校验**：对每个 target 用 `Runtime.evaluate` 跑一个 probe，确认它是"真实的、聚焦的、在屏的 Codex/ChatGPT 渲染器"（不是弹窗/设置面板）。
3. **WebSocket 连接**：用 `target.webSocketDebuggerUrl` 连上，**强制校验 URL 必须落在 loopback 形态内**（拒绝非 `127.0.0.1`/`localhost`/`[::1]` 的地址，防 SSRF）。
4. **注入渲染器**：把 `renderer-inject.js` 作为 `Page.addScriptToEvaluateOnNewDocument` 注入，使每次导航/重渲染都自动重跑。
5. **CSS 合并**：`combinedCss = ${dream-skin.css}\n${safeCssRuntime}\n`，其中 `safeCssRuntime` 是 `theme.css` 经校验后包进 `@layer dreamskin-community { ... }` 的版本。

> 关键安全边界：CDP 只绑本机回环；不改官方二进制与签名；**不**改写 API Key / Base URL（换肤与中转分离）。

---

## 2. 皮肤图片与 Codex 完美贴合：三层机制

"完美贴合"不是一张图硬铺，而是**让图片主动避让原生 UI、并用图片自身的颜色给 UI 配色**。

### 2.1 第一层 · 生图构图规则（`docs/reference-background-prompt-guide.md`）

项目给图生图写了一套**构图安全区协议**，从源头保证"铺在 Codex 底下不会被控件挡住主体"：

| 区域 | 推荐坐标 | 要求 |
|---|---|---|
| 原生内容安全区 | `x=0%–52%` | 连续低对比环境，**不要放脸/手/密集花卉/强光斑**（这里会被左侧栏+正文盖住）|
| 自然过渡区 | `x=45%–62%` | 留白自然过渡，不能像矩形面板 |
| 关键主体安全区 | `x=62%–88%` | 脸/手/道具必须在这里；非关键装饰最多到 `x=90%` |
| 纵向安全区 | `y=16%–72%` | 脸 `y=20%–52%`，手 `y=30%–70%` |
| 边缘保护 | 关键内容距边 ≥ `8%` | 别贴边，否则不同窗口比例会被裁掉 |

母版固定 `2560×1440` 16:9（CSS 用 `cover` 铺满，所以 16:10/4:3/超宽会裁少量边缘）。右侧人物构图的 `theme.json` 必须配 `safeArea:"left"` + `focusX:0.72`，让左侧留给原生内容、窄窗优先保住右侧主体。

### 2.2 第二层 · 运行时图片分析（`renderer-inject.js` 的 `analyzeArt()`，行 356–499）

若 `theme.json` 没写死焦点/安全区，注入脚本会**自己分析图片**（最多 6s 超时降级）：

1. 把图缩到 **96px 宽**的小 canvas，`getImageData` 取每个像素。
2. 逐像素算 `light = 0.2126R+0.7152G+0.0722B`、`hsl.s`（饱和度）。
3. **推断安全区**：比较左右两侧"信息量"（方差×0.58 + 边缘密度×0.42）。信息量低的一侧就是放 UI 的安全侧（`leftInformation < rightInformation*0.86` → `safeArea:"left"`，反之亦然）。
4. **计算焦点**：用显著性权重 `0.01 + |亮度-均值|*0.48 + 饱和度*0.34 + 边缘*0.28` 做加权平均，得到 `focusX/focusY`；安全侧再强制把焦点推到主体侧（left→`focusX≥0.64`）。
5. **提取主题色**：把高饱和像素按色相分 24 个 bin，取权重最大的 bin 的加权平均 RGB 作为 `accentRgb`。
6. **推断宽高比**：`ratio≥2.25`→`banner`，`≥1.75`→`wide`，据此设 `taskMode`。

### 2.3 第三层 · CSS 焦点定位 + 遮罩渐变（`dream-skin.css`）

- **连续背景层**：`__DREAM_SELECTOR_SHELL_MAIN__::before` 用
  `background-image: var(--ds-task-fade), var(--ds-task-shade), var(--dream-skin-art);`
  `background-position: center, center, var(--ds-art-position);`
  `background-size: 100% 100%, 100% 100%, cover;`
  其中 `--ds-art-position` 就是分析出的 `focusX% focusY%`，`cover` 保证铺满且主体不被裁。
- **可读性遮罩（scrim）**：根据安全区方向切换渐变。例如 `safeArea:"left"` 时 `--ds-hero-scrim` 是左深右透的 `linear-gradient(90deg, bg/.90 → transparent)`，把左侧原生内容区压暗保证文字可读；`safeArea:"right"` 则反向；`center` 用径向渐变。
- **面板半透明 + 毛玻璃**：侧栏/卡片/输入框用 `rgb(panel-rgb / .9)` + `backdrop-filter: blur()`，让背景图"透出来"形成连续氛围（即 README 说的"真背景层""真可交互"）。
- **首页 vs 任务页不同强度**：首页 `--ds-task-fade` 重、任务页 `--ds-task-shade` 轻（首页突出氛围、任务页降干扰）；`taskMode` 还能切 `ambient/full/banner/off`。

> 实测：`applyArtMetadata()`（行 323–354）把分析结果写成 `data-dream-art-safe` / `data-dream-task-mode` / `--dream-art-focus-x/y` 等属性与变量，CSS 纯靠这些属性选择器切换布局——**零 JS 布局计算，性能极好**。

### 2.4 贴合关键参数（来自 preset-gothic-void-crusade/theme.json）

```json
"appearance": "dark",
"art": { "focusX": 0.76, "focusY": 0.45, "safeArea": "left", "taskMode": "ambient" },
"colors": { "background":"#0d0d0e","panel":"#171513","accent":"#c8a55a",
            "text":"#f3ead7","muted":"#b5a386","line":"rgba(200,165,90,.28)" }
```

---

## 3. 字体颜色 & 字体：怎么改

### 3.1 字体颜色（两条路）

**路 A — `theme.json` 调色板（主通道，可图像自适应）**
`applyTheme()`（行 225–320）把 `colors.text/accent/muted/line/...` 写成 `--ds-text` / `--ds-accent` / `--ds-muted` / `--ds-line` 等变量，`dream-skin.css` 里**所有文字颜色都引用这些变量**：
```css
html[data-dream-skin="active"] body { color: var(--ds-text) !important; }
```
更妙的是 **`makeAdaptivePalette(sample, shell)`（行 188–223）**：若 `theme.json` 没写死颜色，它拿分析出的图片 `accentRgb` 推导一整套和谐色板（背景/面板/强调/文字），**所以换一张图，UI 配色自动跟着图走**。

**路 B — `theme.css` 安全 CSS（精细覆盖）**
作者可在 `theme.css` 里直接对 12 个注册部件写 `color`，例如：
```css
@layer dreamskin-community {
  html[data-dream-skin="active"] [data-ds-part="composer"] { color: #ffd479; }
}
```
`--ds-theme-color-text` / `--ds-theme-color-muted` 等变量也在允许清单里，可整体改。

### 3.2 字体（字体族 / 字号 / 字重）

- 基类 `dream-skin.css` 的 `body` 字体是**硬编码系统栈**：
  `font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei UI", "Segoe UI", system-ui, sans-serif;`
- 改字体走 **`theme.css` 安全 CSS**，策略允许的属性含 `font-family` / `font-size` / `font-weight` / `letter-spacing` / `line-height`，可作用在 12 个部件上。
- 注入脚本预留了**官方钩子变量**：`--ds-theme-font-family`（默认 `"system"`）、`--ds-theme-font-scale`（默认 `1`）。作者/Studio 把字体写进这些变量，未来运行时即可统一套用（当前基类尚未在 `body` 上消费该变量，社区层 Safe CSS 是实际生效路径）。
- **重要**：README 与代码里**没有"应用内字体选择器"UI**。字体/颜色的改变是**主题作者**在 Studio 写 `theme.css` / 在 `theme.json` 写 `colors` 完成的，普通用户通过"一键换肤/导入 ZIP"使用成品主题。

### 3.3 Safe CSS 安全策略（`safe-css-policy.json`）

为防止任意主题破坏官方界面，社区 CSS 被严格约束：

- **12 个注册部件**（parts）：`root / sidebar / main / header / home / home-hero / project-list / thread / message / composer / composer-toolbar / dialog`
- **允许状态**：`hover` / `focus-visible`
- **允许变量**：`--ds-theme-color-*`（10 个）、`--ds-theme-font-family`、`--ds-theme-font-scale`、`--ds-theme-surface-*`（圆角/透明度/模糊/边框）、`--ds-theme-image-*`（焦点/缩放/压暗/任务强度）等 23 个
- **允许属性（含字体相关）**：`color` / `font-family` / `font-size` / `font-weight` / `letter-spacing` / `line-height` / `backdrop-filter` / `background-color` / `border-*` / `border-radius` / `box-shadow` / `opacity` 等约 35 个
- **限额**：`maxBytes 262144` / `maxRules 128` / `maxDeclarations 512` / `maxValueCharacters 512`
- 校验器把通过的内容包进 `@layer dreamskin-community { ... }`（行 567），因 `dream-skin.css` 顶部声明 `@layer dreamskin-accessibility, dreamskin-community;`，**社区层优先级最高，所以主题作者的字体/颜色覆盖一定赢**。

---

## 4. 与我们 `skins-monorepo` 的对比 & 可借鉴点

我们自己的项目（Codex/Claude Code 托盘换肤）已经做了：CDP 注入、背景图 `url()` 注入、`buildThemeCss` 主题变量、`--ds-*` 风格变量、字体 `font-family` 注入、6 地域预设。

| 能力 | 我们 skins-monorepo | Codex Dream Skin | 差距/借鉴 |
|---|---|---|---|
| CDP 注入不改官方包 | ✅ | ✅ | 持平 |
| 背景图铺满 | ✅（`cover`）| ✅ + `::before` 三层 + scrim | 借鉴：加**焦点定位 + 方向遮罩**让文字始终可读 |
| 主题色变量 | ✅ | ✅ | 持平 |
| **图片自动分析取色/焦点** | ❌（纯手工 `theme.json`）| ✅ `analyzeArt` | **强借鉴**：加 96px canvas 分析，自动算 `accentRgb`/`focus`/`safeArea` |
| **自适应调色板** | ❌ | ✅ `makeAdaptivePalette` | 借鉴：换图即自动配色，体验质变 |
| 安全 CSS 沙箱（12 部件）| ❌（整段 CSS 注入）| ✅ 严格策略 | 借鉴：若开放社区主题，需加校验防破坏 |
| 字体改（family/size/weight）| ✅ 仅 font-family | ✅ family/size/weight + 变量 | 可补：暴露字号/字重钩子 |
| 字体颜色改 | ✅（`--ds-text`）| ✅ palette + Safe CSS | 持平 |

**最值得抄的两点**：
1. `analyzeArt()` 的 96px 缩略图分析法（信息量判安全区、显著性判焦点、色相 bin 取主题色）——几十行就能让我们"换图即自动贴合+自动配色"。
2. 把社区 `theme.css` 关进 `@layer dreamskin-community` + 12 部件白名单，这样开放 UGC 主题也不会搞崩官方界面。

---

## 5. 关键文件索引

| 文件 | 作用 |
|---|---|
| `runtime/renderer-inject.js` | 运行时大脑：图片分析、变量写入、MutationObserver 对齐 |
| `runtime/renderer-inject.js:188` `makeAdaptivePalette` | 从图片强调色推导整套和谐配色 |
| `runtime/renderer-inject.js:323` `applyArtMetadata` | 把焦点/安全区/任务模式写成属性与变量 |
| `runtime/renderer-inject.js:356` `analyzeArt` | 96px canvas 取色/焦点/安全区/宽高比推断 |
| `runtime/dream-skin.css` | 皮肤本体 CSS，全部用 `--ds-*` 变量驱动 |
| `runtime/dream-skin.css:134–209` | 安全区方向遮罩（scrim）渐变切换 |
| `runtime/safe-css-policy.json` | 社区 CSS 安全白名单（12 部件 + 允许属性/变量）|
| `macos/assets/safe-css-validator.mjs:567` | 把通过校验的 theme.css 包进 `@layer dreamskin-community` |
| `macos/scripts/injector.mjs` | CDP 连接、目标探针、CSS 合并注入 |
| `docs/reference-background-prompt-guide.md` | 生图构图安全区协议（贴合的源头）|
| `macos/presets/preset-gothic-void-crusade/theme.json` | 完整主题契约示例（colors/art/appearance）|

---

*调研方式：clone 仓库（`--depth 1`）后逐行精读上述源码，非基于 README 推测。*
