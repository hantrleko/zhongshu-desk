# Changelog

## 1.0.2

- 样例与公开行情、实际周期、最后一根时间（UTC，取自 K 线）和失败回退写在图上。样例上的分钟周期不可选，也不会假选中。
- 周线没有结构、样例三尚未成枢时，侧栏给出空状态说明，不补画笔或中枢。
- 图上三买、三卖用文字标在峰谷旁。最后一笔改为虚线，与已确认笔区分。图例与之一致。
- 语言切换只显示对应简介。右侧先给结论、再列中枢。窄屏下主图仍占主要高度，控件换行，不为了塞进手机而缩小整台终端。

## 1.0.2

- Lessons and public quotes, the actual timeframe, the last bar's UTC stamp from the series, and a failed-quote fallback are written on the desk. Minute chips cannot be selected on a lesson.
- Weekly series with no structure, and lesson 3, show an empty-state note. No strokes or hubs are invented.
- Third-class buy and sell labels are words placed beside the valley or peak. The last stroke is dashed. The legend matches the chart.
- The language switch shows only one intro. The side panel leads with the reading, then the hub list. On a narrow screen the chart keeps most of the height, controls wrap, and the desk is not scaled down as a tiny terminal.

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
