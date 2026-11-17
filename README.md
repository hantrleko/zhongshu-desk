# 中枢台 Zhongshu Desk

Han Yuchen · Eugene Finance

这是用来研究和把玩的：股票是一场谁有钱、谁有货的游戏。中枢是目的，分型、笔、线段和买卖点都只是看见中枢的手段。

This is for study and play. A stock is a game of who has the money and who has the shares. The hub is the aim; fractals, strokes, segments, and buy or sell labels are only ways to see it.

## 中文

### 是什么

中枢台是一个静态网页。打开就能看到 K 线、笔、线段和中枢。中枢画成色带，是画面上要看的东西。它不选股，不模拟下单，没有账户，也没有信息流。

图上的三买、三卖是结构标注，不是交易信号。本站不是投资建议。

### 本地运行

需要 Node.js 22。

```bash
npm install
npm test
npm run dev
```

浏览器打开 http://127.0.0.1:47321 。

另外三条命令：

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run build` 会先做类型检查，再把静态站点写到 `dist/`。

### GitHub Pages

`vite` 的 `base` 读环境变量 `VITE_BASE`。项目页一般是仓库名，首尾都要有斜杠：

```bash
VITE_BASE=/your-repo/ npm run build
```

把 `dist/` 交给 Pages 即可。不设变量时，base 是 `/`，适合用户页或本地预览。

仓库里的 GitHub Actions 按 test → lint（含 typecheck）→ build 的顺序跑。推到 `main` 且这三步都通过之后，才会再用 `VITE_BASE=/zhongshu-desk/` 构建，并发布到 GitHub Pages：https://hantrleko.github.io/zhongshu-desk/ 。Pages 的来源要选 GitHub Actions。

### 样例

三套日线都在 `src/data/fixtures.ts`。转折价格写在文件里，K 线由 `synthesize` 生成：影线上下各 0.5，转折之间留够距离，包含处理不会把分型抹掉。价格是编排的，不是成交。

| 样例 | 看什么 |
| --- | --- |
| 样例一 · 一个中枢 | 9 笔。笔中枢 ZD 107.50、ZG 128.50，延伸后 GG 140.50、DD 99.50，然后向上离开。低点 131.50 上有一个三买标注。 |
| 样例二 · 相邻中枢 | 第一个中枢 ZD 99.50、ZG 120.50，向上离开。第二个 ZD 139.50、ZG 148.50，还在区间里。成员不共用，价格区间也不重叠。 |
| 样例三 · 尚未成枢 | 只有两笔。没有第三笔，就没有中枢。分型和笔仍然画着。 |

这三套都还没有段中枢。样例一和样例二各有一段未完成的线段，图上是虚线。线段的结束和缺口规则在 `tests/segment.test.ts` 里用手写的笔序列核对。

选「周线」时，日线按 UTC 自然周收成一根。以现在的三套课例，周线不够形成笔和中枢，页面写明有多少根、至少要几笔，以及为什么不画，而不是留一块空白。这是级别变了，不是另一套行情。5m、15m、30m、1h 这些芯片在样例上不会拆出更细的价格，图上仍是日线，旁边的来源说明会写出来。

图上的开关默认打开笔、线段、中枢和买卖点。买卖点是小号数字。全隐只藏这些图层，K 线还在。侧栏的缠论状态写出最后一笔、最后一段，以及现价相对当前中枢在上、在内或在下。最后一笔标成未确认，因为它还可以延伸。

### 公开行情

标的里的 AAPL、MSFT、0700.HK，或自己填的代码，会由浏览器直接请求 Yahoo Finance 的图表接口。Yahoo 失败再试 Stooq 的日线 CSV。没有密钥。

静态页面经常被跨域拦住。超时、空表、HTTP 错误都会写在图旁，然后回到当前课例。标题用课例的名字，不写成刚才请求的代码。同一块说明写下来源、K 线区间、最新一根，以及上次读取是成功还是失败。失败不是实时行情。课例价格标成教学价格。不完整的 K 线直接丢掉，不改写，也不补价格。

不承诺沪深 A 股。Stooq 只映射普通美股代码和 `.HK`。时间戳保持来源原样，不换算成交易所时区。

### 算法

实现在 `src/engine/`。页面里的「方法说明」和这里是同一套规则。

1. **包含**。从前向后扫。向上合并取较高的高点和较高的低点，向下取较低的高点和较低的低点。只有一根时，由新 K 线定方向。高低都相同，按向下处理。
2. **分型**。合并后的 K 线上，顶分型的高点和低点都要严格高于左右。相等不算。
3. **笔**。顶和底的中心至少隔 4 根合并 K 线。端点必须是这段里唯一的极值。同向更极端的分型会把笔延伸过去。
4. **线段**。特征序列分型。向上线段看向下笔组成的顶分型，向下线段看底分型。第一、二元素有缺口时，这个分型不结束线段。没有分型就留下未完成线段。不足三笔没有线段。第一段的方向取第一笔的方向。
5. **中枢**。连续三笔或三段的重叠。ZG 是三高里的最低，ZD 是三低里的最高，必须 ZG > ZD。之后只延伸，不改 ZG、ZD。GG、DD 是全体成员的最高和最低。整笔离开区间，这笔不算进中枢，可以开始下一个。同一级别不共用成员。
6. **三买 / 三卖**。离开之后，第一段仍然整个停在区间外的反向笔。没有 MACD，所以没有一买、二买。

缠论门派在包含方向、笔的根数、缺口和中枢边界上并不一致。这是一套可以复核的实现，不是「官方缠论」。

步骤参照缠中说禅公开课里常见的定义。同类开源项目，例如 [waditu/czsc](https://github.com/waditu/czsc)（MIT），使用了相近的顺序。本仓库的代码是按这些规则写的，没有把第三方仓库整份拷进来。

### 图表与许可

本仓库的代码是 MIT，见 `LICENSE`。

K 线使用 [TradingView Lightweight Charts™](https://www.tradingview.com/) 5.x，Apache-2.0。页脚有署名和指向 tradingview.com 的链接。没有使用 TradingView Charting Library，也没有商业授权。说明见 `THIRD-PARTY-NOTICES.txt`。

### 产品边界

没有选股器，没有模拟盘，没有实盘下单，没有钱包，没有账户，没有社交信息流。

## English

### What it is

Zhongshu Desk is a static page for reading candles, strokes, segments, and hubs. The hub is drawn as a band. That is the thing on the screen. There is no screener, no paper trading, no account, and no feed.

Third-class buy and sell marks are structural notes, not trade signals. This is not investment advice.

### Run locally

Node.js 22.

```bash
npm install
npm test
npm run dev
```

Open http://127.0.0.1:47321 .

Also:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run build` typechecks, then writes the static site to `dist/`.

### GitHub Pages

Vite reads `VITE_BASE`. A project site usually needs the repository name, with slashes on both ends:

```bash
VITE_BASE=/your-repo/ npm run build
```

Publish `dist/`. With the variable unset, base is `/`.

GitHub Actions runs test, then lint (including typecheck), then the production build. A push to `main` deploys only after those three pass, rebuilding with `VITE_BASE=/zhongshu-desk/` and publishing to GitHub Pages: https://hantrleko.github.io/zhongshu-desk/ . The repository Pages source has to be GitHub Actions.

### Lessons

The three daily series live in `src/data/fixtures.ts`. The turn prices are written there. `synthesize` builds the OHLC: a wick of 0.5 on each side, and enough bars between turns that inclusion does not erase the fractals. The prices are arranged. They are not prints.

| Lesson | What it shows |
| --- | --- |
| Lesson 1 · one hub | 9 strokes. Stroke hub ZD 107.50, ZG 128.50. After extension, GG 140.50 and DD 99.50. The hub then leaves upward. A third-class buy sits at 131.50. |
| Lesson 2 · adjacent hubs | The first hub is ZD 99.50, ZG 120.50, and leaves upward. The second is ZD 139.50, ZG 148.50, and is still inside its band. Members are not shared. The price bands do not overlap. |
| Lesson 3 · no hub yet | Two strokes. Without a third, there is no hub. Fractals and strokes are still drawn. |

None of the three lessons produces a segment hub. Lessons 1 and 2 each have one unfinished segment, drawn dashed. The segment ending rule and the gap rule are checked on hand-built strokes in `tests/segment.test.ts`.

Weekly view folds the daily bars by UTC week. On the three lessons shipped now, that aggregate is too short for a stroke or a hub. The page says how many bars there are, what the minimum is, and why nothing is drawn, instead of leaving the overlay blank. That is a change of level, not a second quote. The 5m, 15m, 30m, and 1h chips do not invent finer prices on a lesson. The chart stays daily, and the source line says so.

Layer switches default to strokes, segments, hubs, and buy/sell labels. The labels are small numbers. Hide-all removes those layers and leaves the candles. The Chan state panel shows the last stroke, the last segment, and whether the latest close is above, inside, or below the current hub. The last stroke is marked unconfirmed because it can still extend.

### Public quotes

AAPL, MSFT, 0700.HK, or a symbol typed into the box, are requested by the browser from the Yahoo Finance chart endpoint. If Yahoo fails, Stooq daily CSV is tried. There is no API key.

A static page is often stopped by CORS. A timeout, an empty table, or an HTTP error is written beside the chart, and the lesson comes back. The title stays the lesson name. It is not rewritten as the symbol that was just requested. The same note records the source, the bar range, the latest bar, and whether the last fetch succeeded or failed. A failure is not a live quote. Lesson prices are marked as teaching prices. Incomplete bars are dropped. They are not rewritten, and no price is filled in.

China A-shares are not a promised source. Stooq is mapped only for plain US tickers and `.HK`. Timestamps are kept as the source sent them.

### Algorithm

The engine is `src/engine/`. The in-app methods note states the same rules.

1. **Inclusion.** One forward pass. An up merge keeps the higher high and the higher low. A down merge keeps the lower high and the lower low. With a single bar so far, the incoming bar sets the direction. Equal highs and equal lows count as down.
2. **Fractals.** On merged bars, a top needs both a strictly higher high and a strictly higher low than each neighbor. Equality does not count.
3. **Strokes.** Top and bottom centers are at least four merged bars apart. Each endpoint is the unique extreme of the span. A more extreme fractal of the same kind extends the stroke.
4. **Segments.** Feature-sequence fractals. An up segment ends on an ungapped top fractal of its down strokes. A down segment ends on a bottom fractal. A gap between the first and second element does not end the segment. If no fractal appears, the tail stays unfinished. Fewer than three strokes produce no segment. The first segment takes the direction of the first stroke.
5. **Hubs.** The overlap of three consecutive strokes, or three consecutive segments. ZG is the lowest of the three highs. ZD is the highest of the three lows. ZG must be strictly above ZD. Later intersecting swings extend the hub and do not move ZG or ZD. GG and DD are the extreme of every member. A swing that lies entirely outside is not a member and may start the next hub. Same-level hubs do not share members.
6. **Third-class labels.** After a leave, the first counter swing that stays entirely outside the band. There is no MACD, so there is no first-class or second-class label.

Chan schools do not agree on inclusion direction, stroke length, gaps, or hub edges. This is one implementation that can be checked. It is not “the official Chan.”

The order follows definitions commonly taught from the Chan Zhong Shuo Chan lessons. Open work such as [waditu/czsc](https://github.com/waditu/czsc) (MIT) uses a similar order. The TypeScript here was written to these rules. No third-party repository is copied in whole.

### Chart library and license

Code in this repository is MIT. See `LICENSE`.

Candles use [TradingView Lightweight Charts™](https://www.tradingview.com/) 5.x, Apache-2.0. The footer names the library and links to tradingview.com. The TradingView Charting Library is not used, and this project holds no commercial TradingView license. See `THIRD-PARTY-NOTICES.txt`.

### Product boundary

No screener, no paper trading, no live orders, no wallet, no accounts, no social feed.
