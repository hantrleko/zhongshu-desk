import type { HubLevel, HubStatus } from './engine/types.ts';

export type Lang = 'zh' | 'en';

export interface MethodSection {
  heading: string;
  paragraphs: string[];
}

export type ReadingInput = {
  bi?: { direction: 'up' | 'down' };
  seg?: { direction: 'up' | 'down'; finished: boolean };
  hub?: { zd: string; zg: string; place: 'above' | 'inside' | 'below' };
};

interface Copy {
  workspaceLabel: string;
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
  fitAll: string;
  fitAllTip: string;
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
  marketA: string;
  marketUs: string;
  marketGroup: string;
  watchlist: string;
  quoteBoard: string;
  fieldLast: string;
  fieldChange: string;
  fieldOpen: string;
  fieldHigh: string;
  fieldLow: string;
  fieldClose: string;
  fieldVolume: string;
  fieldCurrency: string;
  fieldSource: string;
  fieldDelay: string;
  fieldTime: string;
  delayedYes: string;
  delayedUnknown: string;
  loadLesson: string;
  emptyQuote: string;
  maLayer: string;
  legendMa: string;
  legendVol: string;
  legendMacd: string;
  legendMacdShort: string;
  strokeLabel: string;
  segmentLabel: string;
  hubLabel: string;
  tabChart: string;
  tabWatch: string;
  tabDock: string;
  liveBlurb: string;
  reading: (input: ReadingInput) => string;
  stageReading: (input: ReadingInput) => string;
  hubTitle: (level: HubLevel, index: number) => string;
  counts: (bars: number, strokes: number, segments: number, hubs: number, marks: number) => string;
  layerBi: string;
  layerSeg: string;
  layerZs: string;
  layerBsp: string;
  tipBi: string;
  tipSeg: string;
  tipZs: string;
  tipBsp: string;
  tipLevelBi: string;
  tipLevelSeg: string;
}


function readingZh(input: ReadingInput): string {
  const parts: string[] = [];
  if (input.bi) parts.push(`末笔${input.bi.direction === 'up' ? '向上' : '向下'}，尚未确认，端点仍可能延伸。`);
  else parts.push('当前样本尚未形成有效笔。');
  if (input.seg) parts.push(`线段方向${input.seg.direction === 'up' ? '向上' : '向下'}，${input.seg.finished ? '已确认' : '待确认'}。`);
  else parts.push('线段结构尚未形成。');
  if (input.hub) {
    const place = input.hub.place === 'above' ? '上方' : input.hub.place === 'below' ? '下方' : '内部';
    parts.push(`末根收盘位于最近中枢${place}，区间为 ${input.hub.zd}–${input.hub.zg}。`);
  } else parts.push('当前层级暂无有效中枢。');
  return parts.join('');
}

function readingEn(input: ReadingInput): string {
  const parts = [input.bi ? `The latest stroke points ${input.bi.direction}; it is provisional and its endpoint may extend.` : 'No valid stroke in the available sample.'];
  parts.push(input.seg ? `The segment points ${input.seg.direction} and is ${input.seg.finished ? 'confirmed' : 'provisional'}.` : 'No segment has formed.');
  parts.push(input.hub ? `Last bar close is ${input.hub.place} the latest hub, ${input.hub.zd}–${input.hub.zg}.` : 'No valid hub at this level.');
  return parts.join(' ');
}

function stageReadingZh(input: ReadingInput): string {
  if (!input.hub) return '当前层级暂无有效中枢。';
  const place = input.hub.place === 'above' ? '上方' : input.hub.place === 'below' ? '下方' : '内部';
  return `末根收盘位于中枢${place}${input.bi ? `；末笔${input.bi.direction === 'up' ? '向上' : '向下'}，待确认` : ''}。`;
}

function stageReadingEn(input: ReadingInput): string {
  if (!input.hub) return 'No valid hub at this level.';
  return `Last bar close is ${input.hub.place} the hub${input.bi ? `; the latest ${input.bi.direction} stroke is provisional` : ''}.`;
}

function hubTitleZh(level: HubLevel, index: number): string {
  return `震荡区间 ${index} · ${level === 'bi' ? '按笔构成' : '按线段构成'}`;
}

function hubTitleEn(level: HubLevel, index: number): string {
  return `Range ${index} · built from ${level === 'bi' ? 'strokes' : 'segments'}`;
}

function countsZh(bars: number, strokes: number, segments: number, hubs: number, marks: number): string {
  return `${bars}\u00a0根\u00a0K\u00a0线，${strokes}\u00a0笔，${segments}\u00a0条线段，${hubs}\u00a0个震荡区间，${marks}\u00a0个买卖点`;
}

function plural(count: number, one: string, many: string): string {
  return `${count}\u00a0${count === 1 ? one : many}`;
}

function countsEn(bars: number, strokes: number, segments: number, hubs: number, marks: number): string {
  return `${plural(bars, 'bar', 'bars')}, ${plural(strokes, 'stroke', 'strokes')}, ${plural(segments, 'segment', 'segments')}, ${plural(hubs, 'oscillation range', 'oscillation ranges')}, ${plural(marks, 'buy/sell mark', 'buy/sell marks')}`;
}

const zh: Copy = {
  workspaceLabel: '技术研判',
  symbol: '标的',
  timeframe: '周期',
  tfD: '日线',
  tfW: '周线',
  otherSymbol: '代码',
  read: '查询',
  methods: '研究口径',
  close: '关闭',
  level: '层级',
  levelBi: '笔中枢',
  levelSeg: '线段中枢',
  hubs: '缠论状态',
  skip: '跳到技术研判',
  tfGroup: '周期',
  layerGroup: '图层',
  showAll: '全显',
  hideAll: '全隐',
  fitAll: '全部历史',
  fitAllTip: '显示全部历史 K 线。',
  stateBi: '最近一笔',
  stateSeg: '当前线段',
  stateZs: '最近中枢',
  stateCount: '样本结构',
  dirUp: '向上',
  dirDown: '向下',
  confirmed: '已经确认',
  unconfirmed: '尚未确认',
  noneStruct: '尚未形成',
  priceAbove: '末根收盘位于中枢上方',
  priceInside: '末根收盘位于中枢内部',
  priceBelow: '末根收盘位于中枢下方',
  priorBi: (count) => `此前 ${count} 笔已确认`,
  intradayNote: (label) => `样例没有 ${label} K 线，不能拆得更细。图上仍是日线，没有编造价格。`,
  quoteHint: '公开行情按来源依次请求，失败不会编造价格，也不会自动改用教学样例。',
  placeholder: '300308 或 AAPL',
  langButton: 'EN',
  langLabel: '切换到英文',
  advice: '仅供技术研究，不构成投资建议。行情可能延迟；本站不提供交易执行。',
  footerBefore: '图表组件是 ',
  footerName: 'TradingView Lightweight Charts™',
  footerAfter: '（Apache-2.0），由 TradingView, Inc. 开发。本站与 TradingView 没有隶属关系，没有使用 Charting Library，也没有商业授权。',
  loading: (symbol, timeframe) => `正在请求 ${symbol} 的公开${timeframe}…`,
  quoteFail: '暂未取得所请求行情。已载入的图表将予以保留，标的与周期不变；未载入时保持空白。',
  emptySymbol: '先写一个代码，例如 300308 或 AAPL。',
  badSymbol: '代码只能包含字母、数字和点。',
  noHubTitle: '当前层级暂无有效中枢',
  noHubBody: '当前样本尚未满足同层级连续三笔或三段严格重叠的中枢条件。',
  lastBar: (stamp) => `K线日期 ${stamp}`,
  notRealtime: '非实时',
  teachingPrices: '教学价格，不是成交',
  maybeDelayed: '可能延迟',
  fallbackLesson: (symbol) => `读不到 ${symbol}。图上若已载入教学样例，价格不是成交。`,
  timeframeLine: (requested, actual) =>
    requested === actual
      ? `周期 ${actual}`
      : `请求周期 ${requested}，实际周期 ${actual}。样例没有该周期的 K 线，没有编造价格。`,
  intradayDisabled: '样例没有分钟 K 线，不能选择 5m、15m、30m 或 1h，也不会编造更细的价格。',
  emptyWeekly: (bars, strokes) =>
    `周线样本共 ${bars} 根 K 线、${strokes} 笔，尚未满足中枢条件：至少三笔区间严格重叠。`,
  emptyNeedBi: (bars, strokes) =>
    `当前 ${bars} 根 K 线、${strokes} 笔。震荡区间至少要三笔价格区间重叠，而且上沿必须高于下沿。没有补画笔或震荡区间。`,
  emptyNeedSeg: (segments, finished) =>
    `当前 ${segments} 段（其中 ${finished} 段已确认）。按线段看的震荡区间要三段区间重叠。没有补画线段或震荡区间。`,
  legend: '图例',
  legendBi: '笔（已确认）',
  legendBiOpen: '笔（未确认）',
  legendSeg: '线段（已确认）',
  legendSegOpen: '线段（未完成）',
  legendZs: '震荡区间',
  provenanceLesson: '本地样例',
  provenanceQuote: '公开行情',
  lessonTfHint: '样例只有日线和周线。',
  summary: '结构研判',
  hubListTitle: '中枢档案',
  currentHub: '当前震荡区间',
  latestHub: '最近的震荡区间',
  selected: '已选',
  latestTag: '最近',
  selectedTag: '已选',
  buy: '三买',
  sell: '三卖',
  zg: '上沿',
  zd: '下沿',
  gg: '区间最高',
  dd: '区间最低',
  enterUp: '从下方进入',
  enterDown: '从上方进入',
  members: (count, level) => `${count} ${level === 'bi' ? '笔' : '段'}`,
  extended: '有延伸',
  sourceFixtureD: '本地样例 · 日线 · 价格是为了看结构编排的，不是成交',
  sourceFixtureW: '本地样例 · 日线按 UTC 自然周聚合 · 不是另一套行情',
  sourceLive: (source, symbol, timeframe) => `公开行情 · ${source} · ${symbol} · ${timeframe} · 可能延迟，时间戳沿用数据源`,
  weeklyNote: '现在看的是周线聚合，和上面的日线说明可能不是同一个结构。',
  levelNoteBi: '图上的矩形是按“笔”找出的震荡区间。还没走完的线段画成虚线。',
  levelNoteSegEmpty: '按线段看时，还没有走出震荡区间。那需要三段价格区间重叠。笔仍留在图上。',
  levelNoteSeg: '图上的矩形是按“线段”找出的震荡区间。笔仍留在图上。',
  chartSummary: (title, hubs) => `${title}。图上有 ${hubs} 个震荡区间，明细在震荡区间列表里。`,
  selectedAnnounce: (zd, zg) => `已选中这段震荡区间，下沿 ${zd}，上沿 ${zg}`,
  status: (status, extended, level) => {
    if (status === 'left-up') return '已向上离开';
    if (status === 'left-down') return '已向下离开';
    if (extended) return '中枢延伸，尚无结构性离开';
    return level === 'bi' ? '三笔重叠，尚无结构性离开' : '三段重叠，尚无结构性离开';
  },
  marketA: 'A股',
  marketUs: '美股',
  marketGroup: '市场',
  watchlist: '自选',
  quoteBoard: '行情',
  fieldLast: '最新',
  fieldChange: '涨跌',
  fieldOpen: '开盘',
  fieldHigh: '最高',
  fieldLow: '最低',
  fieldClose: '末根收盘',
  fieldVolume: '成交量',
  fieldCurrency: '货币',
  fieldSource: '来源',
  fieldDelay: '延迟',
  fieldTime: 'K线日期',
  delayedYes: '延迟',
  delayedUnknown: '可能延迟',
  loadLesson: '载入教学样例',
  emptyQuote: '暂无可用行情。公开数据不可用时保留空缺，不以教学样例替代。',
  maLayer: 'MA',
  legendMa: 'MA(5/10/20)',
  legendVol: '成交量',
  legendMacd: 'MACD(12,26,9)，指标，不是缠论',
  legendMacdShort: 'MACD(12,26,9)',
  strokeLabel: '笔',
  segmentLabel: '线段',
  hubLabel: '震荡区间',
  tabChart: '走势图',
  tabWatch: '自选',
  tabDock: '行情与研判',
  liveBlurb: '这是公开行情，不是样例。震荡区间按同一套规则现算。',
  methodsTitle: '研究口径与数据说明',
  reading: readingZh,
  stageReading: stageReadingZh,
  hubTitle: hubTitleZh,
  counts: countsZh,
  layerBi: '笔',
  layerSeg: '线段',
  layerZs: '中枢',
  layerBsp: '买卖点',
  tipBi: '笔：相邻高低点连成的一小段走势。',
  tipSeg: '线段：由几笔组成的更大一段走势。',
  tipZs: '震荡区间（中枢）：价格来回重叠的区域。',
  tipBsp: '买卖点：结构标注，不是下单信号。',
  tipLevelBi: '用“笔”来找震荡区间。',
  tipLevelSeg: '用“线段”来找震荡区间。',
  methodSections: [
    { heading: '价格与指标', paragraphs: [
      '技术研判以末根 K 线的收盘字段为基准，不以行情快照替代。MA20 为最近 20 根收盘均值，方向比较前一根均值；价格高于且均线上移定义为偏强，价格低于且均线下移定义为偏弱，其余为方向不一致。少于 21 根时不归纳趋势。',
      '关键价位包括此前 20 根 K 线的最高、最低价（不含末根），以及当前层级最近中枢的固定上下沿。按距末根收盘的绝对百分比排序，不代表确定的支撑或阻力；涉及待确认笔或线段时单独标注。点击价位可定位样本区间并显示水平参考线。',
      '相对量为末根成交量除以此前 20 根均量。任何一根量缺失或均量为零时不计算。末根未收定时，不应与完整周期直接比较。MACD(12,26,9)采用均值初始化 EMA，柱值为 DIF 减 DEA（未乘 2），不用于背驰判断。',
    ] },
    { heading: '周期与时效', paragraphs: [
      '日线与周线独立请求公开来源，可能来自不同提供方、覆盖不同历史区间。每一栏分别披露来源、K 线日期与延迟状态；日周对照不作跨周期一致性结论。最新日线及本周周线可能更新。K 线日期是数据源标签，不是行情刷新时间。',
      '公开行情请求失败不会影响已载入主图，也不会把日线冒充分钟线。教学样例仅支持日线及按 UTC 自然周聚合的周线，并明确标注为教学价格。',
    ] },
    { heading: '缠论结构', paragraphs: [
      '计算顺序为包含处理、分型、笔、特征序列线段及中枢。同层级连续三笔或三段存在严格非零价格重叠时形成中枢；上下沿由核心三笔或三段固定，后续重叠只延伸中枢。',
      '末笔始终按待确认处理，其端点可能随数据变化。线段确认取决于特征序列；未确认结构以虚线显示。中枢的结构性离开与末根收盘位于中枢之外，是不同判断。',
      '三买、三卖仅是离开中枢后的结构标记，不是下单信号。本站不计算背驰，不提供一买、二买、胜率或收益预测。本实现规则固定可复核，但不代表所有缠论流派。',
    ] },
    { heading: '图表与署名', paragraphs: [
      '图表使用 TradingView Lightweight Charts™（Apache-2.0），非 TradingView Charting Library。本站与 TradingView 无隶属关系。数据和结构仅供技术研究，不构成投资建议。',
    ] },
  ],
};

const en: Copy = {
  workspaceLabel: 'TECHNICAL RESEARCH',
  symbol: 'Symbol',
  timeframe: 'Timeframe',
  tfD: 'Daily',
  tfW: 'Weekly',
  otherSymbol: 'Symbol',
  read: 'Load',
  methods: 'Methodology',
  close: 'Close',
  level: 'Level',
  levelBi: 'Read by strokes',
  levelSeg: 'Read by segments',
  hubs: 'Chan state',
  skip: 'Skip to technical assessment',
  tfGroup: 'Timeframe',
  layerGroup: 'Layers',
  showAll: 'All',
  hideAll: 'None',
  fitAll: 'Fit all',
  fitAllTip: 'Show the full price history.',
  stateBi: 'Latest stroke',
  stateSeg: 'Current segment',
  stateZs: 'Oscillation range',
  stateCount: 'Sample structure',
  dirUp: 'Up',
  dirDown: 'Down',
  confirmed: 'Confirmed',
  unconfirmed: 'Not yet confirmed',
  noneStruct: 'None yet',
  priceAbove: 'Last bar close is above the hub',
  priceInside: 'Last bar close is inside the hub',
  priceBelow: 'Last bar close is below the hub',
  priorBi: (count) => `${count} earlier strokes are confirmed`,
  intradayNote: (label) => `This lesson has no ${label} bars, so it is not split finer. The chart stays on the daily series. No prices are invented.`,
  quoteHint: 'Public quotes are requested in source order. A failure never invents a price and never switches to a lesson by itself.',
  placeholder: '300308 or AAPL',
  langButton: '中文',
  langLabel: 'Switch to Chinese',
  advice: 'For technical research, not investment advice. Quotes may be delayed. No trade execution.',
  footerBefore: 'Charts by ',
  footerName: 'TradingView Lightweight Charts™',
  footerAfter: ' (Apache-2.0), created by TradingView, Inc. This desk is not affiliated with TradingView, does not use the Charting Library, and holds no commercial license.',
  loading: (symbol, timeframe) => `Requesting the public ${timeframe} series for ${symbol}…`,
  quoteFail: 'The requested quote is unavailable. Any existing chart is retained with its original symbol and timeframe; otherwise the chart remains empty.',
  emptySymbol: 'Enter a symbol first, such as 300308 or AAPL.',
  badSymbol: 'Use letters, digits, and dots only.',
  noHubTitle: 'No oscillation range has formed yet',
  noHubBody: 'High and low turns, then “strokes,” appear first. An oscillation range (hub) forms only after at least three strokes (or three segments) overlap, and the upper edge is above the lower edge.',
  lastBar: (stamp) => `Bar date ${stamp}`,
  notRealtime: 'Not live',
  teachingPrices: 'Teaching prices, not prints',
  maybeDelayed: 'May be delayed',
  fallbackLesson: (symbol) => `Could not read ${symbol}. If a lesson is on the chart, those are teaching prices, not prints.`,
  timeframeLine: (requested, actual) =>
    requested === actual
      ? `Timeframe ${actual}`
      : `Requested ${requested}, showing ${actual}. This lesson has no bars at that interval, and no prices were invented.`,
  intradayDisabled: 'Lessons have no minute bars. 5m, 15m, 30m, and 1h cannot be selected, and no finer prices are invented.',
  emptyWeekly: (bars, strokes) =>
    `The weekly sample contains ${bars} bars and ${strokes} strokes. A hub requires a strict overlap across at least three strokes.`,
  emptyNeedBi: (bars, strokes) =>
    `This stretch has ${bars} bars and ${strokes} strokes. An oscillation range needs at least three overlapping strokes, and the upper edge must be above the lower edge. No strokes or ranges were invented.`,
  emptyNeedSeg: (segments, finished) =>
    `There are ${segments} segments (${finished} confirmed). An oscillation range read from segments needs three overlapping segments. No segments or ranges were invented.`,
  legend: 'Legend',
  legendBi: 'Stroke (confirmed)',
  legendBiOpen: 'Stroke (unconfirmed)',
  legendSeg: 'Segment (confirmed)',
  legendSegOpen: 'Segment (unfinished)',
  legendZs: 'Oscillation range',
  provenanceLesson: 'Local lesson',
  provenanceQuote: 'Public quote',
  lessonTfHint: 'Lessons only have daily and weekly bars.',
  summary: 'Structure assessment',
  hubListTitle: 'Oscillation ranges',
  currentHub: 'Current oscillation range',
  latestHub: 'Latest oscillation range',
  selected: 'Selected',
  latestTag: 'Latest',
  selectedTag: 'Selected',
  buy: '3rd buy',
  sell: '3rd sell',
  zg: 'Upper edge',
  zd: 'Lower edge',
  gg: 'Range high',
  dd: 'Range low',
  enterUp: 'Entered from below',
  enterDown: 'Entered from above',
  members: (count, level) => `${count} ${level === 'bi' ? 'strokes' : 'segments'}`,
  extended: 'Extended',
  sourceFixtureD: 'Local lesson · daily · prices are arranged so the structure can be read, not traded',
  sourceFixtureW: 'Local lesson · daily bars folded into UTC weeks · not a separate quote',
  sourceLive: (source, symbol, timeframe) => `Public quote · ${source} · ${symbol} · ${timeframe} · may be delayed; timestamps are kept as received`,
  weeklyNote: 'This is the weekly aggregate. It may not match the daily description above.',
  levelNoteBi: 'The rectangles are oscillation ranges found from “strokes.” Unfinished segments are drawn dashed.',
  levelNoteSegEmpty: 'Reading by segments, no oscillation range has formed yet. That needs three overlapping price spans. Strokes stay on the chart.',
  levelNoteSeg: 'The rectangles are oscillation ranges found from “segments.” Strokes stay on the chart.',
  chartSummary: (title, hubs) => `${title}. ${hubs} oscillation ranges on the chart. The list has the figures.`,
  selectedAnnounce: (zd, zg) => `This oscillation range is selected, lower edge ${zd}, upper edge ${zg}`,
  status: (status, extended, level) => {
    if (status === 'left-up') return 'Left upward';
    if (status === 'left-down') return 'Left downward';
    if (extended) return 'Extending, has not left yet';
    return level === 'bi' ? 'Core of three strokes, has not left yet' : 'Core of three segments, has not left yet';
  },
  marketA: 'A-shares',
  marketUs: 'US',
  marketGroup: 'Market',
  watchlist: 'Watchlist',
  quoteBoard: 'Quote',
  fieldLast: 'Last',
  fieldChange: 'Change',
  fieldOpen: 'Open',
  fieldHigh: 'High',
  fieldLow: 'Low',
  fieldClose: 'Last bar close',
  fieldVolume: 'Volume',
  fieldCurrency: 'Currency',
  fieldSource: 'Source',
  fieldDelay: 'Delay',
  fieldTime: 'Bar date',
  delayedYes: 'Delayed',
  delayedUnknown: 'May be delayed',
  loadLesson: 'Load a teaching lesson',
  emptyQuote: 'No usable quote yet. A failed public source does not automatically switch to teaching prices.',
  maLayer: 'MA',
  legendMa: 'MA(5/10/20)',
  legendVol: 'Volume',
  legendMacd: 'MACD(12,26,9), an indicator, not Chanlun',
  legendMacdShort: 'MACD(12,26,9)',
  strokeLabel: 'Stroke',
  segmentLabel: 'Segment',
  hubLabel: 'Oscillation range',
  tabChart: 'Chart',
  tabWatch: 'Watch',
  tabDock: 'Quote & analysis',
  liveBlurb: 'This is a public quote, not a lesson. Oscillation ranges are computed with the same rules.',
  methodsTitle: 'Methodology & data notes',
  reading: readingEn,
  stageReading: stageReadingEn,
  hubTitle: hubTitleEn,
  counts: countsEn,
  layerBi: 'Stroke',
  layerSeg: 'Segment',
  layerZs: 'Range',
  layerBsp: 'Buy/sell',
  tipBi: 'Stroke: a short move joining a neighboring high and low.',
  tipSeg: 'Segment: a larger move made of several strokes.',
  tipZs: 'Oscillation range (hub): a band where price has overlapped back and forth.',
  tipBsp: 'Buy/sell marks are structural labels, not order signals.',
  tipLevelBi: 'Find oscillation ranges from “strokes.”',
  tipLevelSeg: 'Find oscillation ranges from “segments.”',
  methodSections: [
    { heading: 'Price and indicator evidence', paragraphs: [
      'The assessment uses the last bar close field, not the quote snapshot. MA20 averages the latest 20 closes. A close above a rising MA20 is classified as rising, and a close below a falling MA20 as falling. Other combinations are mixed. At least 21 bars are needed to compare adjacent averages.',
      'Reference levels are the prior 20-bar high and low, excluding the latest bar, and the selected level’s latest hub boundaries. They are sorted by absolute percentage distance from the last close, not by strength. Provisional structure is identified. Click a level to locate its sample window and draw a horizontal reference.',
      'Relative volume is latest volume divided by the prior 20-bar mean, omitted when any required volume is missing or the mean is zero. An unfinished bar is not comparable to a full period. MACD(12,26,9) uses SMA-seeded EMAs. Histogram = DIF − DEA, not doubled; it is not a Chan divergence test.',
    ] },
    { heading: 'Timeframes and freshness', paragraphs: [
      'Daily and weekly bars are requested independently. Providers and history windows may differ. Each row discloses its source, bar date and delay status; no cross-timeframe consensus is inferred. The latest daily and weekly bars may still change. Bar dates are provider period labels, not quote refresh times.',
      'A failed comparison does not affect the primary chart. Daily bars are never relabeled as intraday. Lessons support daily bars and UTC-calendar-week aggregation only, and are labeled as teaching prices.',
    ] },
    { heading: 'Chan structure', paragraphs: [
      'Processing follows inclusion, fractals, strokes, feature-sequence segments and hubs. A hub requires a strict nonzero overlap across three consecutive swings at the same level. Its boundaries remain fixed; overlapping later swings extend it.',
      'The final stroke is always provisional and may extend. Segment confirmation depends on the feature sequence. Provisional structure is dashed. A structural departure from a hub is distinct from the latest close lying outside it.',
      'Third-class buy/sell labels describe structure, not orders. No divergence, first/second-class buys, win rates or return forecasts are calculated. The implementation is reproducible but does not represent every Chan interpretation.',
    ] },
    { heading: 'Chart attribution', paragraphs: [
      'Charts use TradingView Lightweight Charts™ (Apache-2.0), not the TradingView Charting Library. This site is not affiliated with TradingView. Data and structure are for technical research, not investment advice.',
    ] },
  ],
};

const copies: Record<Lang, Copy> = { zh, en };

export function copy(lang: Lang): Copy {
  return copies[lang];
}
