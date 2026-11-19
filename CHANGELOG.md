# Changelog

## 1.3.0

- 默认不再把全部历史装进主图：首次打开或换标的、换周期时，先看最近约 90 根 K 线，价格轴按可见范围缩放，近处的柱体铺满主图。需要看全部历史时，用工具栏里的「看全部」；「全显 / 全隐」仍然只开关图层。
- 收紧工具栏和图表上方的说明：桌面尽量一行，窄屏第一行放品牌、代码和市场，其余芯片单行横滑。图题下只留一句短说明和一行来源、最后一根与延迟；图例收成细条，并写在「怎么看」里。
- 右侧行情板和「现在怎样」改成交易终端的密度：等宽数字、右对齐、细分割线，少一层卡片。自选行更紧，选中更明显。品牌去掉衬线和宽字距。绿涨红跌不变。

- The default viewport no longer fits the entire history. On first load, and when a symbol or timeframe is loaded, the chart shows about the last 90 bars and autoscales price to that window, so recent candles fill the pane. “Fit all” shows the full history. “All / None” still only toggle layers.
- The toolbar and the chrome above the chart are tighter. The desktop bar stays to one row when it can; on a narrow screen the brand, symbol, and market stay on the first row, and the remaining chips scroll sideways as a single row. Under the title, a short stage line and one quiet source / last-bar / delay line remain. The legend is a compact strip and is also listed in “How to read.”
- The quote board and the “What’s happening” dock use terminal density: tabular numbers, right-aligned values, hairline separators, and fewer nested cards. Watchlist rows are denser, with a stronger selected state. The brand is quieter sans-serif, with little letter-spacing. Green-up / red-down is unchanged.


## 1.2.0

- 用语改成好读的完整句子：保留“笔”“线段”“中枢”这些词，但先用白话解释。右侧「现在怎样」先给一段阅读，再列最近一笔、当前线段和震荡区间的上沿、下沿。图题下有一句短说明；窄屏仍显示，最多三行。
- 图层和层级芯片改成「笔 / 线段 / 震荡区 / 买卖点」和「按笔看 / 按线段看」，并加上简短提示。列表标题改为「震荡区间 1 · 按笔构成」。计数不再写 BI、ZS、BSP。
- 默认打开中际旭创（300308），并把它放在自选最前，同时带上茅台等默认名称。地址栏 `?symbol=` 优先，其次是本地记下的代码，读行情成功后会写回地址栏和本地存储，方便分享。
- 收紧右侧结论区，避免「现在怎样」列表最后一行被裁切。窄屏抽屉铺满主图区域，不再露出底下的计数行；页脚改显示学习免责声明，不再被长版权说明挤掉。

- Copy is written as complete sentences. The technical terms stay, but they are explained in plain language first. The dock’s “What’s happening” block leads with a reading, then a definition list with the latest stroke, the current segment, and the range’s upper and lower edges. A short sentence sits under the chart title and remains visible on a narrow screen, clamped to three lines.
- Layer and level chips now read “Stroke / Segment / Range / Buy/sell” and “Read by strokes / Read by segments,” with short tooltips. Hub cards are titled “Range 1 · built from strokes.” Counts no longer use BI, ZS, or BSP.
- The desk opens on Zhongji Innolight (300308), lists it first in the watchlist, and shows default names for the A-share symbols. A `?symbol=` query wins, then the locally stored ticker. A successful quote is written back to the URL and to localStorage so the page can be shared.
- The right-hand reading dock is tighter so the last definition-list row is not clipped. On a narrow screen the drawer covers the chart area instead of leaving the count line showing through, and the footer keeps the study disclaimer instead of only the long chart credit.

## 1.1.0

- 终端布局：近黑全屏主图、细工具条、左侧自选、右侧行情板与缠论结论。K 线按参考图用绿涨红跌，柱体更宽。笔、线段、中枢、三买、三卖标在摆动旁。有成交量时画出量柱，MACD(12,26,9) 作为指标副图，不是缠论。可选 MA(5/10/20)。
- 默认读取 A 股 600519 日线的公开行情，不再自动打开教学样例。A 股走腾讯 / ifzq 与东方财富；美股走东方财富、Yahoo，以及浏览器跨域时的 allorigins 代理，日线仍可再试 Stooq。不会使用损坏的腾讯美股历史，也不会编造价格。全部来源失败时列出原因，教学样例只作为二次按钮。
- 窄屏下主图在前，自选和右侧栏收进底部面板，不为了塞进手机而缩小整台终端。

## 1.1.0

- Terminal layout: a nearly black full-bleed chart, a thin toolbar, a left watchlist, and a right dock with a real quote board then the Chanlun readout. Candles follow the reference coloring, green up and red down, with wider bodies. Stroke, segment, hub, and third-class labels sit next to the swings. Volume appears when the feed supplies it. MACD(12,26,9) is an indicator pane, not Chanlun. MA(5/10/20) is an optional layer.
- The desk opens on the public daily series for A-share 600519, not a teaching lesson. A-shares try Tencent / ifzq then Eastmoney. US symbols try Eastmoney, Yahoo, and Yahoo through allorigins when the browser blocks CORS; daily bars may still try Stooq. Broken Tencent US history is rejected. No price is invented. If every source fails, the page lists the reasons; a lesson is only a secondary button.
- On a narrow screen the chart stays first. The watchlist and the right dock collapse into a bottom panel. The desktop layout is not scaled down as a whole.


## 1.0.2

- 样例与公开行情、实际周期、最后一根时间（UTC，取自 K 线）和失败回退写在图上。样例上的分钟周期不可选，也不会假选中。
- 周线没有结构、样例三尚未成枢时，侧栏给出空状态说明，不补画笔或中枢。
- 图上三买、三卖用文字标在峰谷旁。最后一笔改为虚线，与已确认笔区分。图例与之一致。
- 语言切换只显示对应简介。右侧先给结论、再列中枢。窄屏下主图仍占主要高度，控件换行，不为了塞进手机而缩小整台终端。
- 390 宽屏幕上，读取、语言和方法说明放在同一行，标的与代码并排；简介默认两行、可展开。来源、实际周期和非实时说明仍写在图上。

## 1.0.2

- Lessons and public quotes, the actual timeframe, the last bar's UTC stamp from the series, and a failed-quote fallback are written on the desk. Minute chips cannot be selected on a lesson.
- Weekly series with no structure, and lesson 3, show an empty-state note. No strokes or hubs are invented.
- Third-class buy and sell labels are words placed beside the valley or peak. The last stroke is dashed. The legend matches the chart.
- The language switch shows only one intro. The side panel leads with the reading, then the hub list. On a narrow screen the chart keeps most of the height, controls wrap, and the desk is not scaled down as a tiny terminal.
- At a 390-wide screen, Read, language, and Methods share one row, and the symbol and ticker sit side by side. The intro starts as two lines and can be expanded. Source, actual timeframe, and the non-realtime note stay on the desk.

## 1.0.1

- 图上增加图层开关：笔、线段、中枢、买卖点，以及全显 / 全隐。默认都打开，买卖点只用小号数字。
- 中枢改成灰色虚线带。笔是白线，线段是蓝色虚线。
- 侧栏改为缠论状态：笔和线段的方向与是否确认，当前中枢的 ZG—ZD，以及价格在带内、带上或带下。点一条中枢仍会在图上标出。
- 周期芯片为 5m / 15m / 30m / 1h / D / W。样例只有日线，更细的周期不会编造 K 线。

## 1.0.0

- 中枢台第一版。包含、分型、笔、线段、中枢都在本仓库的 TypeScript 里计算，并用样例锁定结果。
- 图以中枢矩形为主，笔是折线，未完成的线段是虚线。三买、三卖只作小声的结构标注。
- 三套本地日线样例，不联网也能看。公开行情只试 Yahoo 与 Stooq，失败就回到样例，不编造价格。
- 图表使用 TradingView Lightweight Charts™（Apache-2.0）。没有使用 Charting Library，也没有商业授权。

## 1.0.1

- Layer switches for strokes, segments, hubs, and buy/sell labels, plus show-all and hide-all. All start on. Buy/sell marks are small numbers.
- Hubs are gray dashed bands. Strokes are white. Segments are dashed blue.
- The side panel is Chan state: direction and confirmation for the stroke and the segment, the current hub’s ZG—ZD, and whether price is above, inside, or below. Clicking a hub still highlights it.
- Timeframe chips are 5m / 15m / 30m / 1h / D / W. Lessons are daily, so a finer chip does not invent bars.

## 1.0.0

- First release of Zhongshu Desk. Inclusion, fractals, strokes, segments, and hubs are computed by the TypeScript in this repo, and the lessons lock the results.
- Hub rectangles lead the chart. Strokes are polylines. An unfinished segment is dashed. Third-class labels stay quiet.
- Three local daily lessons, usable offline. Public quotes try Yahoo and Stooq only. A failure returns to the lesson and does not invent a price.
- Charts use TradingView Lightweight Charts™ (Apache-2.0). The Charting Library is not used, and there is no commercial license.
