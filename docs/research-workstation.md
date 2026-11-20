# Research workstation (1.5.0)

## Calculation contract

All observations use the last available bar’s `close`, not the quote snapshot’s `last`. The latest bar may still be forming. All window lengths count **bars**, not calendar days. Incoming bars are sorted by timestamp and duplicate or non-increasing timestamps are dropped (`keepValidBars`); bars with non-finite or out-of-range OHLC are discarded, not repaired. No interpolation, missing-bar repair or synthetic prices are performed.

- **MA20**: arithmetic mean of the latest 20 closes. Direction is the latest MA20 minus the preceding MA20 (21 bars required). Close > MA20 and direction > 0 is rising; close < MA20 and direction < 0 is falling; all other combinations are mixed. This is a defined indicator classification, not a forecast or a Chan trend classification.
- **Deviation**: `(last close / MA20 - 1) × 100`.
- **Relative volume**: latest volume divided by the mean of the **preceding** 20 bar volumes. All 21 volumes must be finite and nonnegative; zero baseline suppresses the result. An unfinished period should not be compared directly with completed periods. This is not an exchange’s intraday volume-ratio measure.
- **DIF/DEA**: reuse the existing SMA-seeded MACD(12,26,9) calculation (first full value after 34 bars); histogram = DIF − DEA, not doubled. No divergence is inferred.
- **Rolling levels**: maximum high / minimum low of the preceding 20 bars, excluding the latest. Require 21 bars. Level distance is `(level / last close - 1) × 100`, signed; display order uses absolute distance. Hub boundaries come directly from the existing engine’s latest hub at the selected level. They are marked provisional if any member is the last stroke or an unfinished segment. Rolling extremes and hub boundaries remain separate evidence even when their values coincide.
- **Conditional tests**: a later close strictly above/below the displayed prior range’s high/low satisfies a break of that fixed observation range. A return to or through the boundary invalidates that condition. These are reference tests, not trade entries, stops, recommendations or predictions. Recalculation after a new dataset can change the window.

## Independent daily / weekly data

The primary quote is usable before comparison finishes. Its daily or weekly dataset is reused for that row; the other timeframe is independently requested through the unchanged public quote adapter. For intraday primaries both comparison rows are requested independently. No daily history is relabeled as minutes or used to simulate independent weekly data. Public weekly bars are not resampled again by the UI; teaching lessons still use the existing UTC-week aggregation.

Rows disclose provider, last bar’s provider date label (UTC, not a receipt/update timestamp), and delay state. Different providers, coverages and periods need not agree. No aggregate consensus is inferred. Unknown delay is never presented as live. A failed secondary row becomes unavailable without touching primary bars. A generation guard discards late success **and** failure after another request or a lesson selection. Return symbol, interval and OHLC chronology are validated. A failed primary request retains the prior symbol, actual interval and all existing observations; interval state changes only after successful validation.

## Interface

- Chart first; volume and MACD retain their separate panes. MA(5/10/20) is enabled by default.
- The chart header summarizes Chan position; the adjacent research panel describes indicator evidence separately.
- Settings contains visible range presets, layers, hub level and methodology. No horizontal toolbar hunt on mobile. Outside click / Escape dismiss the settings popover.
- Evidence link shows MAs and the latest 21-bar window. Each price level locates its evidence window and toggles a horizontal reference line. Changing instrument, timeframe or hub level clears it.
- Desktop day/week comparison sits below the chart; mobile comparison is inside “行情与研判”. Structure details are available below the technical assessment.
- Platform sans fonts are used with an explicit `Noto Sans CJK SC` Linux fallback; no external font requests, licenses or new dependencies.

## Manual acceptance still required

No browser or screenshots were available to the executor. Parent should verify at 1280×800 and 390×844:

1. Load `?symbol=300308`, wait for both periods. Confirm body/Chinese/numbers are sans (not serif or mono), chart dominance, legible candle labels, no clipped axis/source text and no page overflow.
2. Compare quote snapshot vs last-bar close; verify the labels do not imply a common update timestamp. Observe provider dates and delay status in each comparison row.
3. Open Chart settings; verify all controls, recent/full-history, layers, selected hub level, methodology dialog, Escape/outside click and keyboard focus return. Repeat in English and at mobile width.
4. Open research panel on mobile. Click indicator evidence and each level; chart should become visible, locate the range, draw/toggle the price line, and return keyboard focus to chart. Switch symbol/timeframe/hub level; old line must clear.
5. Switch D/W/5m and symbols quickly. A slow previous request must not relabel the current chart or comparison. Block the secondary request: primary remains usable with an unavailable comparison row. Block a primary request after a successful load: retain old symbol/interval with a clear error.
6. Check missing/short histories, absent volume, zero volume, no hub, provisional last stroke and unfinished weekly bars. Do not expect volume or trend values when prerequisites fail. Check level labels and observation boundaries against raw OHLC.
7. Verify volume/MACD panes, green-up/red-down, selected hub highlighting, source diagnostics and teaching lesson opt-in remain intact. Confirm no console errors.
