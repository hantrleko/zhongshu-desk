import type { HubLevel, HubStatus } from './engine/types.ts';

export type Lang = 'zh' | 'en';

export interface MethodSection {
  heading: string;
  paragraphs: string[];
}

interface Copy {
  symbol: string;
  timeframe: string;
  tfD: string;
  tfW: string;
  otherSymbol: string;
  read: string;
  methods: string;
  close: string;
  level: string;
  levelBi: string;
  levelSeg: string;
  hubs: string;
  skip: string;
  tfGroup: string;
  layerGroup: string;
  showAll: string;
  hideAll: string;
  stateBi: string;
  stateSeg: string;
  stateZs: string;
  stateCount: string;
  dirUp: string;
  dirDown: string;
  confirmed: string;
  unconfirmed: string;
  noneStruct: string;
  priceAbove: string;
  priceInside: string;
  priceBelow: string;
  priorBi: (count: number) => string;
  intradayNote: (label: string) => string;
  quoteHint: string;
  placeholder: string;
  langButton: string;
  langLabel: string;
  advice: string;
  footerBefore: string;
  footerName: string;
  footerAfter: string;
  loading: (symbol: string, timeframe: string) => string;
  quoteFail: string;
  emptySymbol: string;
  badSymbol: string;
  noHubTitle: string;
  noHubBody: string;
  lastBar: (stamp: string) => string;
  notRealtime: string;
  teachingPrices: string;
  maybeDelayed: string;
  fallbackLesson: (symbol: string) => string;
  timeframeLine: (requested: string, actual: string) => string;
  intradayDisabled: string;
  emptyWeekly: (bars: number, strokes: number) => string;
  emptyNeedBi: (bars: number, strokes: number) => string;
  emptyNeedSeg: (segments: number, finished: number) => string;
  legend: string;
  legendBi: string;
  legendBiOpen: string;
  legendSeg: string;
  legendSegOpen: string;
  legendZs: string;
  provenanceLesson: string;
  provenanceQuote: string;
  lessonTfHint: string;
  summary: string;
  hubListTitle: string;
  currentHub: string;
  latestHub: string;
  selected: string;
  latestTag: string;
  selectedTag: string;
  buy: string;
  sell: string;
  zg: string;
  zd: string;
  gg: string;
  dd: string;
  enterUp: string;
  enterDown: string;
  members: (count: number, level: HubLevel) => string;
  extended: string;
  sourceFixtureD: string;
  sourceFixtureW: string;
  sourceLive: (source: string, symbol: string, timeframe: string) => string;
  weeklyNote: string;
  levelNoteBi: string;
  levelNoteSegEmpty: string;
  levelNoteSeg: string;
  chartSummary: (title: string, hubs: number) => string;
  selectedAnnounce: (zd: string, zg: string) => string;
  status: (status: HubStatus, extended: boolean, level: HubLevel) => string;
  methodsTitle: string;
  methodSections: MethodSection[];
}

const zh: Copy = {
  symbol: '标的',
  timeframe: '周期',
  tfD: '日线',
  tfW: '周线',
  otherSymbol: '其他代码',
  read: '读取',
  methods: '方法说明',
  close: '关闭',
  level: '层级',
  levelBi: '笔中枢',
  levelSeg: '段中枢',
  hubs: '缠论状态',
  skip: '跳到中枢列表',
  tfGroup: '周期',
  layerGroup: '图层',
  showAll: '全显',
  hideAll: '全隐',
  stateBi: '笔 BI',
  stateSeg: '线段 Seg',
  stateZs: '中枢 ZS',
  stateCount: '计数',
  dirUp: '向上',
  dirDown: '向下',
  confirmed: '已确认',
  unconfirmed: '未确认',
  noneStruct: '无',
  priceAbove: '价格在中枢之上',
  priceInside: '价格在中枢之内',
  priceBelow: '价格在中枢之下',
  priorBi: (count) => `此前 ${count} 笔已确认`,
  intradayNote: (label) => `样例没有 ${label} K 线，不能拆得更细。图上仍是日线，没有编造价格。`,
  quoteHint: '公开行情只试 Yahoo 和 Stooq，不保证沪深 A 股。失败就回到样例，不会编造价格。',
  placeholder: 'AAPL 或 0700.HK',
  langButton: 'EN',
  langLabel: '切换到英文',
  advice: '只供学习，不是投资建议，没有实盘下单。这是一套写明的缠论实现，门派并不相同。',
  footerBefore: '图表组件是 ',
  footerName: 'TradingView Lightweight Charts™',
  footerAfter: '（Apache-2.0），由 TradingView, Inc. 开发。本站与 TradingView 没有隶属关系，没有使用 Charting Library，也没有商业授权。',
  loading: (symbol, timeframe) => `正在请求 ${symbol} 的公开${timeframe}…`,
  quoteFail: '公开行情没有可用的 K 线，已回到本地样例。下面的价格不是实时行情。',
  emptySymbol: '先写一个代码，例如 AAPL 或 0700.HK。',
  badSymbol: '代码只能包含字母、数字和点。',
  noHubTitle: '当前没有中枢',
  noHubBody: '分型和笔可以先画出来。中枢要等至少三笔或三段的价格区间重叠，而且 ZG 必须高于 ZD。',
  lastBar: (stamp) => `最后一根 ${stamp}`,
  notRealtime: '非实时',
  teachingPrices: '教学价格，不是成交',
  maybeDelayed: '可能延迟',
  fallbackLesson: (symbol) => `读不到 ${symbol}，已回到本地样例。图上是教学价格，不是实时行情。`,
  timeframeLine: (requested, actual) =>
    requested === actual
      ? `周期 ${actual}`
      : `请求周期 ${requested}，实际周期 ${actual}。样例没有该周期的 K 线，没有编造价格。`,
  intradayDisabled: '样例没有分钟 K 线，不能选择 5m、15m、30m 或 1h，也不会编造更细的价格。',
  emptyWeekly: (bars, strokes) =>
    `周线由日线按 UTC 自然周聚合，目前 ${bars} 根、${strokes} 笔。没有补画笔或中枢。至少三笔重叠且 ZG 高于 ZD，才会形成中枢。`,
  emptyNeedBi: (bars, strokes) =>
    `当前 ${bars} 根 K 线、${strokes} 笔。中枢至少要三笔价格区间重叠，而且 ZG 必须高于 ZD。没有补画笔或中枢。`,
  emptyNeedSeg: (segments, finished) =>
    `当前 ${segments} 段（其中 ${finished} 段已确认）。段中枢要三段区间重叠。没有补画线段或中枢。`,
  legend: '图例',
  legendBi: '笔（已确认）',
  legendBiOpen: '笔（未确认）',
  legendSeg: '线段（已确认）',
  legendSegOpen: '线段（未完成）',
  legendZs: '中枢',
  provenanceLesson: '本地样例',
  provenanceQuote: '公开行情',
  lessonTfHint: '样例只有日线和周线。',
  summary: '结论',
  hubListTitle: '中枢',
  currentHub: '当前中枢',
  latestHub: '最近的中枢',
  selected: '已选',
  latestTag: '当前',
  selectedTag: '已选',
  buy: '三买',
  sell: '三卖',
  zg: 'ZG',
  zd: 'ZD',
  gg: 'GG',
  dd: 'DD',
  enterUp: '进入：向上',
  enterDown: '进入：向下',
  members: (count, level) => `${count} ${level === 'bi' ? '笔' : '段'}`,
  extended: '有延伸',
  sourceFixtureD: '本地样例 · 日线 · 价格是为了看结构编排的，不是成交',
  sourceFixtureW: '本地样例 · 日线按 UTC 自然周聚合 · 不是另一套行情',
  sourceLive: (source, symbol, timeframe) => `公开行情 · ${source} · ${symbol} · ${timeframe} · 可能延迟，时间戳沿用数据源`,
  weeklyNote: '现在看的是周线聚合，和上面的日线说明可能不是同一个结构。',
  levelNoteBi: '矩形是笔中枢。线段若还没被特征序列结束，画成虚线。',
  levelNoteSegEmpty: '这一层还没有段中枢。段中枢要三段区间重叠。笔仍留在图上。',
  levelNoteSeg: '矩形是段中枢。笔仍留在图上。',
  chartSummary: (title, hubs) => `${title}。图上有 ${hubs} 个中枢，明细在中枢列表里。`,
  selectedAnnounce: (zd, zg) => `已选中中枢，ZD ${zd}，ZG ${zg}`,
  status: (status, extended, level) => {
    if (status === 'left-up') return '已向上离开';
    if (status === 'left-down') return '已向下离开';
    if (extended) return '延伸中，仍在区间内';
    return level === 'bi' ? '核心三笔，仍在区间内' : '核心三段，仍在区间内';
  },
  methodsTitle: '方法与界限',
  methodSections: [
    {
      heading: '界限',
      paragraphs: [
        '这是研究和把玩用的台子，不是投资建议。它不连接券商，不下单，也不承诺收益。',
        '三买、三卖只是结构标注，用小号文字标在图上，不是交易信号。',
      ],
    },
    {
      heading: '数据',
      paragraphs: [
        '三套样例是仓库里的日线 OHLC，转折是排出来的，好让中枢看得清。它们不是某只股票的成交。样例没有 5 分钟、15 分钟、30 分钟和 1 小时 K 线。点这些周期不会拆出新价格，图上仍是日线。',
        '选择公开行情时，页面直接请求 Yahoo Finance 的图表接口；失败再试 Stooq 的日线 CSV。没有密钥，也没有付费终端。静态页面经常被浏览器跨域拦住。拦住、超时或返回空表时，页面写明原因，并回到样例。',
        '不完整的 K 线会被丢掉，不会被改写。没有任何一条价格是补出来的。',
        '不承诺沪深 A 股行情。代码可以试，试不到就是试不到。Stooq 只映射普通美股代码和 .HK。',
        '样例的周线是把日线按 UTC 自然周收成一根，不是交易所日历，也不是另一份行情。公开行情的时间戳保持来源原样，不换算成交易所时区。',
      ],
    },
    {
      heading: '这一套算法',
      paragraphs: [
        '先做包含。两根 K 线的高低区间互相包住时合成一根。前面已经有方向时，向上取较高的高点和较高的低点，向下取较低的高点和较低的低点。只有一根时，用新 K 线相对它来定方向。高低都相同，按向下处理。只从前向后扫一遍。',
        '分型看合并后的 K 线。顶分型要求中间的高点和低点都严格高于左右两根。底分型相反。相等不算。',
        '笔连接一顶一底。两个分型的中心至少隔 4 根合并 K 线，也就是中间至少有一根不属于这两个分型。向上笔的顶必须是这段里唯一的最高点，底必须是唯一的最低点。同向分型只留更极端的那个，笔可以因此延伸。',
        '线段用特征序列。向上线段把向下笔当作元素，出现没有缺口的顶分型时，线段结束在这个分型中间元素的前一笔。向下线段看底分型。第一、二元素若有缺口——向上时第二元素整个在第一元素上方，向下时整个在下方——这个分型不结束线段。走到末尾还没有分型，就留下一段未完成线段，图上用虚线。不足三笔，没有线段。第一段的方向取第一笔的方向，这是一个明确的取舍：图可能从一段走势的中途开始。段的高低取成员笔的全部波动，不只是两个端点。',
        '中枢是连续至少三笔，或连续至少三段，价格区间的重叠。ZG 是这三笔高点里的最低值，ZD 是低点里的最高值，而且必须 ZG 高于 ZD。只贴住一个价，不算中枢。后面的笔如果还和 [ZD, ZG] 相交，中枢延伸：ZG、ZD 不改，GG、DD 记下全体成员的最高和最低。整笔落在 ZG 之上是向上离开，整笔落在 ZD 之下是向下离开。离开的那一笔不算进这个中枢，可以成为下一个中枢的第一笔。同一级别的中枢不共用成员。笔中枢和段中枢是两层，时间上可以重叠。',
        '三买：向上离开之后，第一段仍然整个位于 ZG 之上的向下笔，标在它的低点。三卖对称。这里没有 MACD 背驰，所以不标一买、二买。图上用「三买」「三卖」小号文字标出，比中枢轻。最后一笔画成虚线并标成未确认，因为它还可以延伸；更早的笔是实线，标成已确认。线段是否确认，看特征序列有没有结束。',
      ],
    },
    {
      heading: '不是官方缠论',
      paragraphs: [
        '包含的方向、笔要几根 K 线、缺口算不算结束、中枢的边界，不同教材并不一样。这里只是一套前后一致、可以用样例和测试复核的实现。',
        '三套图上的样例都还没有走出段中枢。样例一和样例二各有一段未完成的线段；线段结束和缺口的规则在单元测试里用手写的笔序列核对。',
      ],
    },
    {
      heading: '参考与图表',
      paragraphs: [
        '步骤来自缠中说禅公开课里常见的定义。同类开源实现，例如 waditu/czsc（MIT），用了相近的顺序。本仓库的 TypeScript 是按这些规则写的，没有把第三方仓库整份搬进来。',
        'K 线使用 TradingView Lightweight Charts™，许可证是 Apache-2.0。页脚有指向 tradingview.com 的署名。本站不使用 TradingView Charting Library，也没有它的商业授权。',
      ],
    },
  ],
};

const en: Copy = {
  symbol: 'Symbol',
  timeframe: 'Timeframe',
  tfD: 'Daily',
  tfW: 'Weekly',
  otherSymbol: 'Other symbol',
  read: 'Load',
  methods: 'Methods',
  close: 'Close',
  level: 'Level',
  levelBi: 'Stroke hubs',
  levelSeg: 'Segment hubs',
  hubs: 'Chan state',
  skip: 'Skip to the hub list',
  tfGroup: 'Timeframe',
  layerGroup: 'Layers',
  showAll: 'All',
  hideAll: 'None',
  stateBi: 'Stroke BI',
  stateSeg: 'Segment Seg',
  stateZs: 'Hub ZS',
  stateCount: 'Count',
  dirUp: 'Up',
  dirDown: 'Down',
  confirmed: 'Confirmed',
  unconfirmed: 'Unconfirmed',
  noneStruct: 'None',
  priceAbove: 'Price is above the hub',
  priceInside: 'Price is inside the hub',
  priceBelow: 'Price is below the hub',
  priorBi: (count) => `${count} earlier strokes are confirmed`,
  intradayNote: (label) => `This lesson has no ${label} bars, so it is not split finer. The chart stays on the daily series. No prices are invented.`,
  quoteHint: 'Public quotes try Yahoo and Stooq only. China A-shares are not promised. A failure returns to the lesson and never invents a price.',
  placeholder: 'AAPL or 0700.HK',
  langButton: '中文',
  langLabel: 'Switch to Chinese',
  advice: 'Educational only. Not investment advice. No live orders. This is one documented Chan implementation; schools differ.',
  footerBefore: 'Charts by ',
  footerName: 'TradingView Lightweight Charts™',
  footerAfter: ' (Apache-2.0), created by TradingView, Inc. This desk is not affiliated with TradingView, does not use the Charting Library, and holds no commercial license.',
  loading: (symbol, timeframe) => `Requesting the public ${timeframe} series for ${symbol}…`,
  quoteFail: 'The public quote returned no usable bars. The chart is back on the local lesson. These prices are not live.',
  emptySymbol: 'Enter a symbol first, such as AAPL or 0700.HK.',
  badSymbol: 'Use letters, digits, and dots only.',
  noHubTitle: 'No hub in this stretch',
  noHubBody: 'Fractals and strokes can appear first. A hub waits until at least three strokes or three segments overlap, with ZG above ZD.',
  lastBar: (stamp) => `Last bar ${stamp}`,
  notRealtime: 'Not live',
  teachingPrices: 'Teaching prices, not prints',
  maybeDelayed: 'May be delayed',
  fallbackLesson: (symbol) => `Could not read ${symbol}. The chart is back on the local lesson. These are teaching prices, not a live quote.`,
  timeframeLine: (requested, actual) =>
    requested === actual
      ? `Timeframe ${actual}`
      : `Requested ${requested}, showing ${actual}. This lesson has no bars at that interval, and no prices were invented.`,
  intradayDisabled: 'Lessons have no minute bars. 5m, 15m, 30m, and 1h cannot be selected, and no finer prices are invented.',
  emptyWeekly: (bars, strokes) =>
    `Weekly bars fold the daily lesson by UTC week. This series has ${bars} bars and ${strokes} strokes. No strokes or hubs were invented. A hub still needs three overlapping strokes with ZG above ZD.`,
  emptyNeedBi: (bars, strokes) =>
    `This stretch has ${bars} bars and ${strokes} strokes. A hub needs at least three overlapping strokes, with ZG above ZD. No strokes or hubs were invented.`,
  emptyNeedSeg: (segments, finished) =>
    `There are ${segments} segments (${finished} confirmed). A segment hub needs three overlapping segments. No segments or hubs were invented.`,
  legend: 'Legend',
  legendBi: 'Stroke (confirmed)',
  legendBiOpen: 'Stroke (unconfirmed)',
  legendSeg: 'Segment (confirmed)',
  legendSegOpen: 'Segment (unfinished)',
  legendZs: 'Hub',
  provenanceLesson: 'Local lesson',
  provenanceQuote: 'Public quote',
  lessonTfHint: 'Lessons only have daily and weekly bars.',
  summary: 'Reading',
  hubListTitle: 'Hubs',
  currentHub: 'Current hub',
  latestHub: 'Latest hub',
  selected: 'Selected',
  latestTag: 'Now',
  selectedTag: 'Selected',
  buy: '3rd buy',
  sell: '3rd sell',
  zg: 'ZG',
  zd: 'ZD',
  gg: 'GG',
  dd: 'DD',
  enterUp: 'Entered upward',
  enterDown: 'Entered downward',
  members: (count, level) => `${count} ${level === 'bi' ? 'strokes' : 'segments'}`,
  extended: 'Extended',
  sourceFixtureD: 'Local lesson · daily · prices are arranged so the structure can be read, not traded',
  sourceFixtureW: 'Local lesson · daily bars folded into UTC weeks · not a separate quote',
  sourceLive: (source, symbol, timeframe) => `Public quote · ${source} · ${symbol} · ${timeframe} · may be delayed; timestamps are kept as received`,
  weeklyNote: 'This is the weekly aggregate. It may not match the daily description above.',
  levelNoteBi: 'Rectangles are stroke hubs. A segment that has not ended is drawn dashed.',
  levelNoteSegEmpty: 'No segment hub at this level yet. That needs three overlapping segments. Strokes stay on the chart.',
  levelNoteSeg: 'Rectangles are segment hubs. Strokes stay on the chart.',
  chartSummary: (title, hubs) => `${title}. ${hubs} hubs on the chart. The list has the figures.`,
  selectedAnnounce: (zd, zg) => `Hub selected. ZD ${zd}, ZG ${zg}`,
  status: (status, extended, level) => {
    if (status === 'left-up') return 'Left upward';
    if (status === 'left-down') return 'Left downward';
    if (extended) return 'Extending, still inside the band';
    return level === 'bi' ? 'Core of three strokes, still inside the band' : 'Core of three segments, still inside the band';
  },
  methodsTitle: 'Methods and limits',
  methodSections: [
    {
      heading: 'Limits',
      paragraphs: [
        'This desk is for study and play. It is not investment advice. It does not connect to a broker, send orders, or promise a result.',
        'Third-class buy and sell labels are structural notes, written as small text on the chart. They are not trade signals.',
      ],
    },
    {
      heading: 'Data',
      paragraphs: [
        'The three lessons are daily OHLC shipped in this repo. The turns are arranged so a hub can be seen. They are not prints from a listed stock. The lessons have no 5-minute, 15-minute, 30-minute, or 1-hour bars. Those chips do not invent a finer series. The chart stays daily.',
        'A public quote asks the Yahoo Finance chart endpoint from the browser, then Stooq daily CSV if Yahoo fails. There is no API key and no paid terminal. A static page is often blocked by CORS. On a block, a timeout, or an empty table, the page says so and returns to the lesson.',
        'Incomplete bars are dropped. They are not repaired. No price is filled in.',
        'China A-share coverage is not promised. A symbol can be tried. If the source has nothing, that is the result. Stooq is only mapped for plain US tickers and .HK.',
        'Weekly bars on a lesson fold the daily bars by UTC week, not by an exchange calendar. Public timestamps are kept as the source sent them.',
      ],
    },
    {
      heading: 'This implementation',
      paragraphs: [
        'Inclusion runs forward. When two ranges contain each other they become one bar. If a direction is already set, an up merge keeps the higher high and the higher low; a down merge keeps the lower high and the lower low. With only one bar so far, the incoming bar sets the direction. Equal highs and equal lows are treated as down.',
        'Fractals are read on merged bars. A top needs both a strictly higher high and a strictly higher low than each neighbor. A bottom is the reverse. Equality does not count.',
        'A stroke joins a top and a bottom. The fractal centers are at least four merged bars apart, so at least one bar between them belongs to neither fractal. The top of an up stroke is the unique highest high of the span, and the bottom is the unique lowest low. A later fractal of the same kind replaces the endpoint when it is more extreme, which is how a stroke extends.',
        'Segments use the feature sequence. For an up segment the down strokes are the elements. An ungapped top fractal ends the segment at the with-trend stroke just before the middle element. A down segment looks for a bottom fractal. A gap — the second element entirely above the first in an up segment, or entirely below it in a down segment — does not end the segment. If the series runs out before a fractal, the tail stays unfinished and is drawn dashed. Fewer than three strokes produce no segment. The first segment takes the direction of the first stroke. That is a choice: a chart can open in the middle of a larger move. A segment’s high and low are the full excursion of its strokes, not only the two endpoints.',
        'A hub is the overlap of at least three consecutive strokes, or three consecutive segments. ZG is the lowest of those highs. ZD is the highest of those lows. ZG must be strictly above ZD. A single-price touch is not a hub. Later swings that still intersect [ZD, ZG] extend the hub. ZG and ZD stay fixed. GG and DD record the highest high and lowest low of every member. A swing entirely above ZG leaves upward. A swing entirely below ZD leaves downward. The leaving swing is not a member. It can start the next hub. Hubs on the same level do not share members. Stroke hubs and segment hubs are different levels and may overlap in time.',
        'A third-class buy is the first down stroke after an upward leave that stays entirely above ZG, marked at its low. A third-class sell is the mirror. There is no MACD divergence here, so first-class and second-class points are not labeled. On the chart the labels are the words for a third-class buy or sell, quieter than the hub. The last stroke is drawn dashed and marked unconfirmed because it can still extend. Earlier strokes are solid and confirmed. A segment is confirmed when its feature-sequence fractal has ended it.',
      ],
    },
    {
      heading: 'Not an official Chan',
      paragraphs: [
        'Schools differ on inclusion direction, how many bars a stroke needs, whether a gap ends a segment, and where a hub stops. This is one consistent implementation that the lessons and the tests can check.',
        'The three chart lessons do not reach a segment hub. Lessons 1 and 2 each carry one unfinished segment. The ending rule and the gap rule are checked in unit tests on hand-built strokes.',
      ],
    },
    {
      heading: 'Sources and the chart',
      paragraphs: [
        'The order follows definitions commonly taught from the Chan Zhong Shuo Chan lessons. Open implementations such as waditu/czsc (MIT) use a similar order. The TypeScript in this repo was written to these rules. No third-party repository is vendored.',
        'Candles are drawn with TradingView Lightweight Charts™, Apache-2.0. The footer links to tradingview.com. This desk does not use the TradingView Charting Library and does not hold a commercial license for it.',
      ],
    },
  ],
};

const copies: Record<Lang, Copy> = { zh, en };

export function copy(lang: Lang): Copy {
  return copies[lang];
}
