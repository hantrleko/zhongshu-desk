# Changelog

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
