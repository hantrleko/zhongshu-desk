# Changelog

## 1.0.2

- 图旁边固定写下图上实际是哪一套、来源、K 线区间、最新一根，以及上次读取的结果。公开行情失败时，标题保持课例名字，并写明读不到所请求的代码；教学价格单独标出。不把失败说成实时行情。
- 周线或线段不够形成结构时，写明至少要几笔、为什么不画。不补笔、线段或中枢。分钟周期在课例上仍明确说没有更细的 K 线。
- 术语表说明笔、线段、中枢、ZG、ZD、GG、DD、买卖点，并分开已确认、未确认和教学实现。

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

## 1.0.2

- The chart keeps a record of what is actually drawn: source, bar range, latest bar, and the last fetch. When a public quote fails, the title stays the lesson name and says the requested symbol did not load. Teaching prices are labeled. A failure is not called a live quote.
- When weekly bars or segments are too few for a structure, the page states the minimum and why nothing is drawn. Strokes, segments, and hubs are not filled in. Minute chips on a lesson still say there is no finer series.
- A glossary defines stroke, segment, hub, ZG, ZD, GG, DD, and BSP, and separates confirmed, unconfirmed, and this teaching implementation.

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
