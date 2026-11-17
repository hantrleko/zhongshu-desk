import type { Timeframe } from './data/resample.ts';
import type { HubLevel, HubStatus } from './engine/types.ts';

export type Lang = 'zh' | 'en';

export interface MethodSection {
  heading: string;
  paragraphs: string[];
}

export interface GlossaryEntry {
  id: 'bi' | 'seg' | 'zs' | 'zg' | 'zd' | 'gg' | 'dd' | 'bsp';
  term: string;
  text: string;
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
  chartSummaryQuote: (title: string, hubs: number) => string;
  chartSummaryFallback: (title: string, symbol: string, hubs: number) => string;
  selectedAnnounce: (zd: string, zg: string) => string;
  glossarySummary: string;
  glossaryEntries: GlossaryEntry[];
  glossaryConfirm: string;
  glossarySchool: string;
  kindLesson: string;
  kindQuote: string;
  kindFallback: (symbol: string) => string;
  tfName: (timeframe: Timeframe) => string;
  provAlertFallback: (symbol: string, lesson: string) => string;
  provAlertBad: (lesson: string) => string;
  provAlertEmpty: (shown: string) => string;
  provSourceLessonD: string;
  provSourceLessonW: string;
  provSourceLessonIntraday: (label: string) => string;
  provSourceQuote: (source: string, symbol: string, timeframe: string) => string;
  provRange: (from: string, to: string, count: number, latest: string) => string;
  provRangeWeekly: (from: string, to: string, count: number, latest: string) => string;
  provRangeEmpty: string;
  provFetchIdle: string;
  provFetchLoadingLesson: (symbol: string, timeframe: string, shown: string) => string;
  provFetchLoadingSame: (symbol: string, timeframe: string) => string;
  provFetchLoadingOther: (symbol: string, timeframe: string, shown: string) => string;
  provFetchReady: (source: string, symbol: string, timeframe: string) => string;
  provFetchFailed: (symbol: string, timeframe: string, reasons: string) => string;
  provFetchBad: string;
  provFetchEmpty: string;
  provTeaching: string;
  provTeachingNot: (symbol: string) => string;
  provQuoteBlurb: string;
  gapNoStrokeTitle: string;
  gapNoStroke: (bars: number, merged: number) => string;
  gapHubShortTitle: string;
  gapHubShort: (unit: string, count: number) => string;
  gapNoOverlapTitle: string;
  gapNoOverlap: (unit: string, count: number) => string;
  gapSegmentShortTitle: string;
  gapSegmentShort: (segments: number, finished: number, unfinished: number) => string;
  gapNoSegmentTitle: string;
  gapNoSegment: (strokes: number) => string;
  gapUnitBi: string;
  gapUnitSeg: string;
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
  quoteHint: '公开行情只试 Yahoo 和 Stooq，不保证沪深 A 股。失败就回到课例，标题也回到课例，不会编造成交价。',
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
  chartSummaryQuote: (title, hubs) => `${title}。公开行情，不是实时推送。图上有 ${hubs} 个中枢，明细在列表里。`,
  chartSummaryFallback: (title, symbol, hubs) => `${title}。这不是 ${symbol}。教学价格。图上有 ${hubs} 个中枢，明细在列表里。`,
  selectedAnnounce: (zd, zg) => `已选中中枢，ZD ${zd}，ZG ${zg}`,
  glossarySummary: '术语',
  glossaryEntries: [
    {
      id: 'bi',
      term: '笔 BI',
      text: '一顶一底连成的一段走势。最后一笔标成未确认，因为它还可以延伸；更早的笔标成已确认。',
    },
    {
      id: 'seg',
      term: '线段 Seg',
      text: '至少三笔才有线段。特征序列把这段结束了，才算已确认；没结束就是未确认，图上用虚线。',
    },
    {
      id: 'zs',
      term: '中枢 ZS',
      text: '连续至少三笔，或连续至少三段，价格区间叠在一起。ZG 必须高于 ZD。只贴住一个价，不算中枢。',
    },
    {
      id: 'zg',
      term: 'ZG',
      text: '中枢区间的上沿。取最初三笔（或三段）高点里的最低值，延伸时不改。',
    },
    {
      id: 'zd',
      term: 'ZD',
      text: '中枢区间的下沿。取最初三笔（或三段）低点里的最高值，延伸时不改。',
    },
    {
      id: 'gg',
      term: 'GG',
      text: '中枢全体成员里的最高价。延伸时可以抬高，ZG 不动。',
    },
    {
      id: 'dd',
      term: 'DD',
      text: '中枢全体成员里的最低价。延伸时可以降低，ZD 不动。',
    },
    {
      id: 'bsp',
      term: '买卖点 BSP',
      text: '这里只标三买和三卖，是结构注记，不是下单信号。没有用 MACD，所以不标一买、二买。',
    },
  ],
  glossaryConfirm: '已确认，是说这笔已经走完，或这段已经被特征序列结束。未确认，是说最后一笔仍可能延伸，或这段还没被结束。',
  glossarySchool: '这是一套写明的教学实现。包含怎么合并、笔要几根、缺口算不算、中枢边界画在哪里，各门派并不相同。这里不是官方缠论。',
  kindLesson: '本地课例',
  kindQuote: '公开行情',
  kindFallback: (symbol) => `不是 ${symbol}`,
  tfName: (timeframe) =>
    ({ '5m': '5 分钟', '15m': '15 分钟', '30m': '30 分钟', '1h': '1 小时', D: '日线', W: '周线' })[timeframe],
  provAlertFallback: (symbol, lesson) => `读不到 ${symbol}。图上是本地课例「${lesson}」，不是 ${symbol}。`,
  provAlertBad: (lesson) => `这个代码不能读。图上仍是本地课例「${lesson}」。`,
  provAlertEmpty: (shown) => `先写一个代码，例如 AAPL 或 0700.HK。图上仍是「${shown}」。`,
  provSourceLessonD: '来源：本地课例 · 日线 · 教学价格。这些价格是为了看结构编排的，不是成交，也不是实时行情。',
  provSourceLessonW: '来源：本地课例 · 日线按 UTC 自然周收成周线 · 教学价格。不是另一套行情，也不是实时行情。',
  provSourceLessonIntraday: (label) =>
    `来源：本地课例 · 教学价格。没有 ${label} K 线，图上仍是日线，没有把日线拆成更细的价格。`,
  provSourceQuote: (source, symbol, timeframe) =>
    `来源：${source} · ${symbol} · ${timeframe} · 公开行情，可能延迟。这是上次读到的 K 线，不是实时行情。`,
  provRange: (from, to, count, latest) => `区间：${from} → ${to}（UTC）· ${count} 根 · 最新一根 ${latest}。`,
  provRangeWeekly: (from, to, count, latest) =>
    `区间：${from} → ${to}（UTC）· ${count} 根周线 · 最新一根记的是该周周一 ${latest}，不是周内最后一根日线。`,
  provRangeEmpty: '区间：没有 K 线。',
  provFetchIdle: '上次读取：没有请求公开行情。',
  provFetchLoadingLesson: (symbol, timeframe, shown) =>
    `上次读取：正在请求 ${symbol}（${timeframe}）的公开行情。图上仍是「${shown}」，这些 K 线还不是 ${symbol}。`,
  provFetchLoadingSame: (symbol, timeframe) =>
    `上次读取：正在请求 ${symbol}（${timeframe}）的公开行情。图上仍是上一份 ${symbol}，新的 K 线还没到。`,
  provFetchLoadingOther: (symbol, timeframe, shown) =>
    `上次读取：正在请求 ${symbol}（${timeframe}）的公开行情。图上仍是 ${shown}，还不是 ${symbol}。`,
  provFetchReady: (source, symbol, timeframe) =>
    `上次读取：成功，来自 ${source}。读到的是 ${symbol}（${timeframe}）。这不是实时推送。`,
  provFetchFailed: (symbol, timeframe, reasons) =>
    reasons
      ? `上次读取：失败。请求的是 ${symbol}（${timeframe}）。${reasons}`
      : `上次读取：失败。请求的是 ${symbol}（${timeframe}）。没有可用的 K 线。`,
  provFetchBad: '上次读取：没有发出请求。代码只能包含字母、数字和点。',
  provFetchEmpty: '上次读取：没有发出请求。代码是空的。',
  provTeaching: '教学价格，不是成交。',
  provTeachingNot: (symbol) => `教学价格，不是 ${symbol}。`,
  provQuoteBlurb: '这是上次读到的公开行情，不是课例，也不是实时推送。中枢按同一套规则现算。',
  gapNoStrokeTitle: '这段 K 线还画不出笔和中枢',
  gapNoStroke: (bars, merged) =>
    `现在有 ${bars} 根 K 线，包含处理后剩下 ${merged} 根。笔要一顶一底，两个分型的中心至少隔 4 根合并 K 线，端点还得是这段里唯一的极值。这里没有形成笔，所以没有线段，也没有中枢。图上只留 K 线，不补结构。中枢至少要连续三笔或三段重叠，而且 ZG 高于 ZD。`,
  gapHubShortTitle: '这一层还没有中枢',
  gapHubShort: (unit, count) =>
    `这里有 ${count} ${unit}。中枢要连续至少 3 ${unit}，高低区间重叠，而且 ZG 高于 ZD。只贴住一个价不算。少了的部分不补。`,
  gapNoOverlapTitle: '这几段区间没有重叠成中枢',
  gapNoOverlap: (unit, count) =>
    `这里有 ${count} ${unit}。任取连续的 3 ${unit}，区间都没有重叠到 ZG 高于 ZD。只贴住一个价也不算。图上不另画中枢。`,
  gapSegmentShortTitle: '这一层没有段中枢',
  gapSegmentShort: (segments, finished, unfinished) =>
    `段中枢要连续至少三段，价格区间重叠，而且 ZG 高于 ZD。这里一共 ${segments} 段：${finished} 段已确认，${unfinished} 段未确认，还不到三段。不把笔中枢当成段中枢，也不编造线段。`,
  gapNoSegmentTitle: '还没有线段，也没有段中枢',
  gapNoSegment: (strokes) => `线段至少要三笔。这里有 ${strokes} 笔，没有形成线段，所以没有段中枢。图上不编造线段。`,
  gapUnitBi: '笔',
  gapUnitSeg: '段',
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
        '三买、三卖只是结构标注，字号和颜色都压在中枢下面。它们不是交易信号。',
      ],
    },
    {
      heading: '数据',
      paragraphs: [
        '三套样例是仓库里的日线 OHLC，转折是排出来的，好让中枢看得清。它们不是某只股票的成交。样例没有 5 分钟、15 分钟、30 分钟和 1 小时 K 线。点这些周期不会拆出新价格，图上仍是日线。',
        '选择公开行情时，页面直接请求 Yahoo Finance 的图表接口；失败再试 Stooq 的日线 CSV。没有密钥，也没有付费终端。静态页面经常被浏览器跨域拦住。拦住、超时或返回空表时，页面写明原因，并回到样例。',
        '失败之后，标题保持课例的名字，不写成刚才请求的代码。图旁边写明请求了什么、图上实际是哪一套、K 线从哪一根到哪一根、最新一根的时间，以及上次读取是成功还是失败。失败不是实时行情。',
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
        '三买：向上离开之后，第一段仍然整个位于 ZG 之上的向下笔，标在它的低点。三卖对称。这里没有 MACD 背驰，所以不标一买、二买。图上的买卖点只是小号数字，比中枢轻。最后一笔标成未确认，因为它还可以延伸；更早的笔标成已确认。线段是否确认，看特征序列有没有结束。',
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
  quoteHint: 'Public quotes try Yahoo and Stooq only. China A-shares are not promised. A failure returns to the lesson, and the title returns with it. No print is invented.',
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
  chartSummaryQuote: (title, hubs) => `${title}. Public quote, not a live feed. ${hubs} hubs on the chart. The list has the figures.`,
  chartSummaryFallback: (title, symbol, hubs) =>
    `${title}. This is not ${symbol}. Teaching prices. ${hubs} hubs on the chart. The list has the figures.`,
  selectedAnnounce: (zd, zg) => `Hub selected. ZD ${zd}, ZG ${zg}`,
  glossarySummary: 'Terms',
  glossaryEntries: [
    {
      id: 'bi',
      term: 'Stroke BI',
      text: 'A stroke joins one top and one bottom. The last stroke is unconfirmed because it can still extend. Earlier strokes are confirmed.',
    },
    {
      id: 'seg',
      term: 'Segment Seg',
      text: 'A segment needs at least three strokes. It is confirmed when a feature-sequence fractal ends it. Otherwise it is unconfirmed and drawn dashed.',
    },
    {
      id: 'zs',
      term: 'Hub ZS',
      text: 'The overlap of at least three consecutive strokes, or three consecutive segments. ZG has to sit strictly above ZD. A single shared price is not a hub.',
    },
    {
      id: 'zg',
      term: 'ZG',
      text: 'The top of the hub band. The lowest high of the first three strokes or segments. Extension does not move it.',
    },
    {
      id: 'zd',
      term: 'ZD',
      text: 'The bottom of the hub band. The highest low of the first three strokes or segments. Extension does not move it.',
    },
    {
      id: 'gg',
      term: 'GG',
      text: 'The highest high among every member of the hub. Extension can raise it. ZG stays put.',
    },
    {
      id: 'dd',
      term: 'DD',
      text: 'The lowest low among every member of the hub. Extension can lower it. ZD stays put.',
    },
    {
      id: 'bsp',
      term: 'BSP',
      text: 'Only a third-class buy or sell is marked. It is a structural note, not an order. There is no MACD here, so first-class and second-class points are not labeled.',
    },
  ],
  glossaryConfirm:
    'Confirmed means the stroke has finished, or a feature-sequence fractal has ended the segment. Unconfirmed means the last stroke can still extend, or the segment has not been ended.',
  glossarySchool:
    'This is one documented teaching implementation. Schools differ on inclusion, how many bars a stroke needs, gaps, and hub edges. It is not an official Chan theory.',
  kindLesson: 'Local lesson',
  kindQuote: 'Public quote',
  kindFallback: (symbol) => `Not ${symbol}`,
  tfName: (timeframe) =>
    ({ '5m': '5-minute', '15m': '15-minute', '30m': '30-minute', '1h': '1-hour', D: 'daily', W: 'weekly' })[timeframe],
  provAlertFallback: (symbol, lesson) => `${symbol} did not load. The chart is the local lesson “${lesson}”, not ${symbol}.`,
  provAlertBad: (lesson) => `That symbol cannot be read. The chart is still the local lesson “${lesson}”.`,
  provAlertEmpty: (shown) => `Enter a symbol first, such as AAPL or 0700.HK. The chart is still “${shown}”.`,
  provSourceLessonD:
    'Source: local lesson · daily · teaching prices. Arranged so the structure can be read. Not prints, and not a live feed.',
  provSourceLessonW:
    'Source: local lesson · daily bars folded into UTC weeks · teaching prices. Not a separate quote, and not a live feed.',
  provSourceLessonIntraday: (label) =>
    `Source: local lesson · teaching prices. There are no ${label} bars. The chart stays on the daily series. No finer prices are invented.`,
  provSourceQuote: (source, symbol, timeframe) =>
    `Source: ${source} · ${symbol} · ${timeframe} · public quote, may be delayed. These are the bars from the last response, not a live feed.`,
  provRange: (from, to, count, latest) => `Range: ${from} → ${to} (UTC) · ${count} bars · latest bar ${latest}.`,
  provRangeWeekly: (from, to, count, latest) =>
    `Range: ${from} → ${to} (UTC) · ${count} weekly bars · the latest bar is stamped with that week’s Monday ${latest}, not the last daily bar inside the week.`,
  provRangeEmpty: 'Range: no bars.',
  provFetchIdle: 'Last fetch: no public quote was requested.',
  provFetchLoadingLesson: (symbol, timeframe, shown) =>
    `Last fetch: requesting ${symbol} (${timeframe}) from the public quote. The chart is still “${shown}”. These bars are not ${symbol}.`,
  provFetchLoadingSame: (symbol, timeframe) =>
    `Last fetch: requesting ${symbol} (${timeframe}) from the public quote. The chart still shows the previous ${symbol} bars. The new bars have not arrived.`,
  provFetchLoadingOther: (symbol, timeframe, shown) =>
    `Last fetch: requesting ${symbol} (${timeframe}) from the public quote. The chart is still ${shown}, not ${symbol}.`,
  provFetchReady: (source, symbol, timeframe) =>
    `Last fetch: succeeded, from ${source}. Received ${symbol} (${timeframe}). This is not a live feed.`,
  provFetchFailed: (symbol, timeframe, reasons) =>
    reasons
      ? `Last fetch: failed. Asked for ${symbol} (${timeframe}). ${reasons}`
      : `Last fetch: failed. Asked for ${symbol} (${timeframe}). No usable bars came back.`,
  provFetchBad: 'Last fetch: no request was sent. Use letters, digits, and dots only.',
  provFetchEmpty: 'Last fetch: no request was sent. The symbol box was empty.',
  provTeaching: 'Teaching prices, not prints.',
  provTeachingNot: (symbol) => `Teaching prices, not ${symbol}.`,
  provQuoteBlurb: 'This is the public quote from the last response, not a lesson and not a live feed. Hubs use the same rules.',
  gapNoStrokeTitle: 'No stroke or hub on this stretch',
  gapNoStroke: (bars, merged) =>
    `There are ${bars} bars, ${merged} after inclusion. A stroke needs a top and a bottom whose centers are at least 4 merged bars apart, and each endpoint has to be the unique extreme of that span. No stroke formed, so there is no segment and no hub. The candles stay. Nothing is filled in. A hub needs at least three consecutive strokes or segments that overlap, with ZG above ZD.`,
  gapHubShortTitle: 'No hub at this level yet',
  gapHubShort: (unit, count) =>
    `There are ${count} ${unit}. A hub needs at least 3 consecutive ${unit} whose ranges overlap, with ZG above ZD. A single shared price does not count. The missing part is not filled in.`,
  gapNoOverlapTitle: 'These ranges do not overlap into a hub',
  gapNoOverlap: (unit, count) =>
    `There are ${count} ${unit}. No 3 consecutive ${unit} overlap with ZG above ZD. A single shared price does not count. No hub is drawn.`,
  gapSegmentShortTitle: 'No segment hub at this level',
  gapSegmentShort: (segments, finished, unfinished) =>
    `A segment hub needs at least three consecutive segments whose ranges overlap, with ZG above ZD. This stretch has ${segments} in total, ${finished} confirmed and ${unfinished} unconfirmed. That is short of three. A stroke hub is not promoted, and no segment is invented.`,
  gapNoSegmentTitle: 'No segment, and no segment hub',
  gapNoSegment: (strokes) =>
    `A segment needs at least three strokes. There are ${strokes} strokes and no segment, so there is no segment hub. No segment is invented.`,
  gapUnitBi: 'strokes',
  gapUnitSeg: 'segments',
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
        'Third-class buy and sell labels are structural notes. They are drawn quieter than the hubs. They are not trade signals.',
      ],
    },
    {
      heading: 'Data',
      paragraphs: [
        'The three lessons are daily OHLC shipped in this repo. The turns are arranged so a hub can be seen. They are not prints from a listed stock. The lessons have no 5-minute, 15-minute, 30-minute, or 1-hour bars. Those chips do not invent a finer series. The chart stays daily.',
        'A public quote asks the Yahoo Finance chart endpoint from the browser, then Stooq daily CSV if Yahoo fails. There is no API key and no paid terminal. A static page is often blocked by CORS. On a block, a timeout, or an empty table, the page says so and returns to the lesson.',
        'When a public quote fails, the title stays the lesson name. It is not rewritten as the symbol that was just requested. Beside the chart the desk names the request, the series actually shown, the bar range, the latest bar, and whether the last fetch succeeded or failed. A failure is not a live quote.',
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
        'A third-class buy is the first down stroke after an upward leave that stays entirely above ZG, marked at its low. A third-class sell is the mirror. There is no MACD divergence here, so first-class and second-class points are not labeled. On the chart those labels are small numbers, quieter than the hub. The last stroke is marked unconfirmed because it can still extend. Earlier strokes are confirmed. A segment is confirmed when its feature-sequence fractal has ended it.',
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
