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
  if (!input.bi) {
    parts.push('图上还没有形成笔。');
  } else {
    const dir = input.bi.direction === 'up' ? '向上' : '向下';
    parts.push(`最近一笔还在${dir}走，但还没确认，后面的 K 线可能会改写它。`);
  }
  if (!input.seg) {
    parts.push(input.bi ? '更大一级的线段还没有走出来。' : '更大一级的线段也还没有走出来。');
  } else {
    const dir = input.seg.direction === 'up' ? '向上' : '向下';
    if (input.seg.finished) {
      parts.push(`更大一级的线段目前${dir}，已经走完。`);
    } else if (input.bi) {
      parts.push(`更大一级的线段目前${dir}，同样还没走完。`);
    } else {
      parts.push(`更大一级的线段目前${dir}，还没走完。`);
    }
  }
  if (!input.hub) {
    parts.push('还没有走出一段价格来回重叠的震荡区间（也叫中枢）。');
  } else if (input.hub.place === 'inside') {
    parts.push(`现价在最近一段震荡区间里（下沿 ${input.hub.zd}，上沿 ${input.hub.zg}）。`);
  } else {
    const place = input.hub.place === 'above' ? '上方' : '下方';
    parts.push(`现价在最近一段震荡区间的${place}（下沿 ${input.hub.zd}，上沿 ${input.hub.zg}）。`);
  }
  return parts.join('');
}

function readingEn(input: ReadingInput): string {
  const parts: string[] = [];
  if (!input.bi) {
    parts.push('No stroke has formed on the chart yet.');
  } else {
    const dir = input.bi.direction === 'up' ? 'up' : 'down';
    parts.push(
      `The latest stroke is still moving ${dir}, but it is not confirmed yet, and later bars may rewrite it.`,
    );
  }
  if (!input.seg) {
    parts.push(input.bi ? 'A larger segment has not formed yet.' : 'A larger segment has not formed yet either.');
  } else {
    const dir = input.seg.direction === 'up' ? 'up' : 'down';
    if (input.seg.finished) {
      parts.push(`The larger segment is currently ${dir}, and it has finished.`);
    } else if (input.bi) {
      parts.push(`The larger segment is currently ${dir}, and it has not finished either.`);
    } else {
      parts.push(`The larger segment is currently ${dir}, and it has not finished.`);
    }
  }
  if (!input.hub) {
    parts.push('A price-overlapping oscillation range (also called a hub) has not formed yet.');
  } else {
    const place =
      input.hub.place === 'above' ? 'above' : input.hub.place === 'below' ? 'below' : 'inside';
    parts.push(
      `The last price is ${place} the latest oscillation range (lower edge ${input.hub.zd}, upper edge ${input.hub.zg}).`,
    );
  }
  return parts.join(' ');
}

function stageReadingZh(input: ReadingInput): string {
  if (!input.hub) return '还没有形成震荡区间。';
  const place =
    input.hub.place === 'above'
      ? '现价在震荡区间上方'
      : input.hub.place === 'below'
        ? '现价在震荡区间下方'
        : '现价在震荡区间里';
  if (!input.bi) return `${place}。`;
  const dir = input.bi.direction === 'up' ? '向上' : '向下';
  return `${place}，最近一笔${dir}但尚未确认。`;
}

function stageReadingEn(input: ReadingInput): string {
  if (!input.hub) return 'No oscillation range has formed yet.';
  const place =
    input.hub.place === 'above'
      ? 'Price is above the oscillation range'
      : input.hub.place === 'below'
        ? 'Price is below the oscillation range'
        : 'Price is inside the oscillation range';
  if (!input.bi) return `${place}.`;
  const dir = input.bi.direction === 'up' ? 'up' : 'down';
  return `${place}; the latest stroke is ${dir} but not yet confirmed.`;
}

function hubTitleZh(level: HubLevel, index: number): string {
  return `震荡区间 ${index} · ${level === 'bi' ? '按笔构成' : '按线段构成'}`;
}

function hubTitleEn(level: HubLevel, index: number): string {
  return `Range ${index} · built from ${level === 'bi' ? 'strokes' : 'segments'}`;
}

function countsZh(bars: number, strokes: number, segments: number, hubs: number, marks: number): string {
  return `${bars} 根 K 线，${strokes} 笔，${segments} 条线段，${hubs} 个震荡区间，${marks} 个买卖点`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function countsEn(bars: number, strokes: number, segments: number, hubs: number, marks: number): string {
  return `${plural(bars, 'bar', 'bars')}, ${plural(strokes, 'stroke', 'strokes')}, ${plural(segments, 'segment', 'segments')}, ${plural(hubs, 'oscillation range', 'oscillation ranges')}, ${plural(marks, 'buy/sell mark', 'buy/sell marks')}`;
}

const zh: Copy = {
  symbol: '标的',
  timeframe: '周期',
  tfD: '日线',
  tfW: '周线',
  otherSymbol: '代码',
  read: '读取',
  methods: '怎么看',
  close: '关闭',
  level: '层级',
  levelBi: '按笔看',
  levelSeg: '按线段看',
  hubs: '缠论状态',
  skip: '跳到震荡区间列表',
  tfGroup: '周期',
  layerGroup: '图层',
  showAll: '全显',
  hideAll: '全隐',
  stateBi: '最近一笔',
  stateSeg: '当前线段',
  stateZs: '震荡区间',
  stateCount: '图上有',
  dirUp: '向上',
  dirDown: '向下',
  confirmed: '已经确认',
  unconfirmed: '尚未确认',
  noneStruct: '还没有',
  priceAbove: '现价在震荡区间上方',
  priceInside: '现价在震荡区间里',
  priceBelow: '现价在震荡区间下方',
  priorBi: (count) => `此前 ${count} 笔已确认`,
  intradayNote: (label) => `样例没有 ${label} K 线，不能拆得更细。图上仍是日线，没有编造价格。`,
  quoteHint: '公开行情按来源依次请求，失败不会编造价格，也不会自动改用教学样例。',
  placeholder: '300308 或 AAPL',
  langButton: 'EN',
  langLabel: '切换到英文',
  advice: '只供学习，不是投资建议，没有实盘下单。这是一套写明的缠论实现，门派并不相同。',
  footerBefore: '图表组件是 ',
  footerName: 'TradingView Lightweight Charts™',
  footerAfter: '（Apache-2.0），由 TradingView, Inc. 开发。本站与 TradingView 没有隶属关系，没有使用 Charting Library，也没有商业授权。',
  loading: (symbol, timeframe) => `正在请求 ${symbol} 的公开${timeframe}…`,
  quoteFail: '公开行情没有可用的 K 线。下面列出了各来源的原因。没有编造价格，也没有自动改用教学样例。',
  emptySymbol: '先写一个代码，例如 300308 或 AAPL。',
  badSymbol: '代码只能包含字母、数字和点。',
  noHubTitle: '还没有形成震荡区间',
  noHubBody: '先会出现高低转折和“笔”。要等至少三笔（或三段）的价格区间发生重叠，并且上沿高于下沿，才会形成震荡区间（中枢）。',
  lastBar: (stamp) => `最后一根 ${stamp}`,
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
    `周线由日线按 UTC 自然周聚合，目前 ${bars} 根、${strokes} 笔。没有补画笔或震荡区间。至少三笔重叠且上沿高于下沿，才会形成震荡区间（中枢）。`,
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
  summary: '现在怎样',
  hubListTitle: '震荡区间',
  currentHub: '当前震荡区间',
  latestHub: '最近的震荡区间',
  selected: '已选',
  latestTag: '当前',
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
    if (extended) return '延伸中，还没有被离开';
    return level === 'bi' ? '核心三笔，还没有被离开' : '核心三段，还没有被离开';
  },
  marketA: 'A股',
  marketUs: '美股',
  marketGroup: '市场',
  watchlist: '自选',
  quoteBoard: '行情',
  fieldLast: '最新',
  fieldChange: '涨跌',
  fieldOpen: '开',
  fieldHigh: '高',
  fieldLow: '低',
  fieldClose: '收',
  fieldVolume: '量',
  fieldCurrency: '货币',
  fieldSource: '来源',
  fieldDelay: '延迟',
  fieldTime: '时间',
  delayedYes: '延迟',
  delayedUnknown: '可能延迟',
  loadLesson: '载入教学样例',
  emptyQuote: '还没有可用的行情。公开来源失败时，不会自动改用教学价格。',
  maLayer: 'MA',
  legendMa: 'MA(5/10/20)',
  legendVol: '成交量',
  legendMacd: 'MACD(12,26,9)，指标，不是缠论',
  strokeLabel: '笔',
  segmentLabel: '线段',
  hubLabel: '震荡区间',
  tabChart: '图',
  tabWatch: '自选',
  tabDock: '行情',
  liveBlurb: '这是公开行情，不是样例。震荡区间按同一套规则现算。',
  methodsTitle: '怎么看这张图',
  reading: readingZh,
  stageReading: stageReadingZh,
  hubTitle: hubTitleZh,
  counts: countsZh,
  layerBi: '笔',
  layerSeg: '线段',
  layerZs: '震荡区',
  layerBsp: '买卖点',
  tipBi: '笔：相邻高低点连成的一小段走势。',
  tipSeg: '线段：由几笔组成的更大一段走势。',
  tipZs: '震荡区间（中枢）：价格来回重叠的区域。',
  tipBsp: '买卖点：结构标注，不是下单信号。',
  tipLevelBi: '用“笔”来找震荡区间。',
  tipLevelSeg: '用“线段”来找震荡区间。',
  methodSections: [
    {
      heading: '这些词是什么意思',
      paragraphs: [
        '笔：把相邻的一个高点和一个低点连起来，是图上较短的一段走势。最后一笔常会再被后面的 K 线拉长，所以还没确认时画成虚线。',
        '线段：由连续几笔组成的更大一段走势。',
        '震荡区间（中枢）：价格来回走、高低重叠出来的一段区域。上沿是这段重叠里较低的那个高点，下沿是较高的那个低点。',
        '按笔看 / 按线段看：用“笔”或“线段”去找这样的震荡区间，不是两套不同的行情。',
        '三买 / 三卖：价格离开震荡区间之后的结构标注，只供对照，不是下单建议。',
      ],
    },
    {
      heading: '这是用来研究和把玩的',
      paragraphs: [
        '股票是一场谁有钱、谁有货的游戏。中枢是目的，分型、笔、线段和买卖点都只是看见中枢的手段。',
      ],
    },
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
        'A 股优先请求腾讯 / ifzq，失败再试东方财富。美股先试东方财富，再试 Yahoo，浏览器跨域拦住时最后再试 allorigins 代理的 Yahoo；日线还可再试 Stooq。没有密钥，也没有付费终端。不会使用已经损坏的腾讯美股历史（例如只有 2011 与 2026 两根的返回）。',
        '拦住、超时或返回不可用的 K 线时，页面写明每个来源的原因。不会编造价格，也不会自动改用教学样例。需要时可以按按钮载入教学样例。',
        '不完整的 K 线会被丢掉，不会被改写。没有任何一条价格是补出来的。成交量只在来源提供时显示。MACD 和均线是由收盘价计算的指标，不是缠论。',
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
        '震荡区间（中枢）是连续至少三笔，或连续至少三段，价格区间的重叠。上沿（ZG）是这三笔高点里的最低值，下沿（ZD）是低点里的最高值，而且必须上沿高于下沿。只贴住一个价，不算震荡区间。后面的笔如果还和 [下沿, 上沿] 相交，区间延伸：上沿、下沿不改，区间最高（GG）、区间最低（DD）记下全体成员的最高和最低。整笔落在上沿之上是向上离开，整笔落在下沿之下是向下离开。离开的那一笔不算进这段震荡区间，可以成为下一段的第一笔。同一级别的震荡区间不共用成员。按笔构成和按线段构成是两层，时间上可以重叠。',
        '三买：向上离开之后，第一段仍然整个位于上沿之上的向下笔，标在它的低点。三卖对称。这里没有 MACD 背驰，所以不标一买、二买。图上用「三买」「三卖」小号文字标出，比震荡区间轻。最后一笔画成虚线并标成尚未确认，因为它还可以延伸；更早的笔是实线，标成已经确认。线段是否确认，看特征序列有没有结束。',
      ],
    },
    {
      heading: '不是官方缠论',
      paragraphs: [
        '包含的方向、笔要几根 K 线、缺口算不算结束、中枢的边界，不同教材并不一样。这里只是一套前后一致、可以用样例和测试复核的实现。',
        '三套图上的样例都还没有走出按线段构成的震荡区间。样例一和样例二各有一段未完成的线段；线段结束和缺口的规则在单元测试里用手写的笔序列核对。',
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
  otherSymbol: 'Symbol',
  read: 'Load',
  methods: 'How to read',
  close: 'Close',
  level: 'Level',
  levelBi: 'Read by strokes',
  levelSeg: 'Read by segments',
  hubs: 'Chan state',
  skip: 'Skip to the oscillation range list',
  tfGroup: 'Timeframe',
  layerGroup: 'Layers',
  showAll: 'All',
  hideAll: 'None',
  stateBi: 'Latest stroke',
  stateSeg: 'Current segment',
  stateZs: 'Oscillation range',
  stateCount: 'On the chart',
  dirUp: 'Up',
  dirDown: 'Down',
  confirmed: 'Confirmed',
  unconfirmed: 'Not yet confirmed',
  noneStruct: 'None yet',
  priceAbove: 'Price is above the oscillation range',
  priceInside: 'Price is inside the oscillation range',
  priceBelow: 'Price is below the oscillation range',
  priorBi: (count) => `${count} earlier strokes are confirmed`,
  intradayNote: (label) => `This lesson has no ${label} bars, so it is not split finer. The chart stays on the daily series. No prices are invented.`,
  quoteHint: 'Public quotes are requested in source order. A failure never invents a price and never switches to a lesson by itself.',
  placeholder: '300308 or AAPL',
  langButton: '中文',
  langLabel: 'Switch to Chinese',
  advice: 'Educational only. Not investment advice. No live orders. This is one documented Chan implementation; schools differ.',
  footerBefore: 'Charts by ',
  footerName: 'TradingView Lightweight Charts™',
  footerAfter: ' (Apache-2.0), created by TradingView, Inc. This desk is not affiliated with TradingView, does not use the Charting Library, and holds no commercial license.',
  loading: (symbol, timeframe) => `Requesting the public ${timeframe} series for ${symbol}…`,
  quoteFail: 'The public quote returned no usable bars. Each source is listed below. No price was invented, and the chart did not fall back to a lesson by itself.',
  emptySymbol: 'Enter a symbol first, such as 300308 or AAPL.',
  badSymbol: 'Use letters, digits, and dots only.',
  noHubTitle: 'No oscillation range has formed yet',
  noHubBody: 'High and low turns, then “strokes,” appear first. An oscillation range (hub) forms only after at least three strokes (or three segments) overlap, and the upper edge is above the lower edge.',
  lastBar: (stamp) => `Last bar ${stamp}`,
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
    `Weekly bars fold the daily lesson by UTC week. This series has ${bars} bars and ${strokes} strokes. No strokes or oscillation ranges were invented. A range still needs three overlapping strokes, with the upper edge above the lower edge.`,
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
  summary: "What's happening",
  hubListTitle: 'Oscillation ranges',
  currentHub: 'Current oscillation range',
  latestHub: 'Latest oscillation range',
  selected: 'Selected',
  latestTag: 'Now',
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
  fieldClose: 'Close',
  fieldVolume: 'Volume',
  fieldCurrency: 'Currency',
  fieldSource: 'Source',
  fieldDelay: 'Delay',
  fieldTime: 'Time',
  delayedYes: 'Delayed',
  delayedUnknown: 'May be delayed',
  loadLesson: 'Load a teaching lesson',
  emptyQuote: 'No usable quote yet. A failed public source does not automatically switch to teaching prices.',
  maLayer: 'MA',
  legendMa: 'MA(5/10/20)',
  legendVol: 'Volume',
  legendMacd: 'MACD(12,26,9), an indicator, not Chanlun',
  strokeLabel: 'Stroke',
  segmentLabel: 'Segment',
  hubLabel: 'Oscillation range',
  tabChart: 'Chart',
  tabWatch: 'Watch',
  tabDock: 'Quote',
  liveBlurb: 'This is a public quote, not a lesson. Oscillation ranges are computed with the same rules.',
  methodsTitle: 'How to read this chart',
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
    {
      heading: 'What these words mean',
      paragraphs: [
        'Stroke: a short move on the chart that joins a neighboring high and a neighboring low. The last stroke is often extended by later bars, so it is drawn dashed until it is confirmed.',
        'Segment: a larger move made of several consecutive strokes.',
        'Oscillation range (hub): a band where price has overlapped back and forth. The upper edge is the lowest of those highs; the lower edge is the highest of those lows.',
        'Read by strokes / Read by segments: these use strokes or segments to find that oscillation range. They are not two different quotes.',
        'Third-class buy / third-class sell: structural labels after price leaves an oscillation range. They are for comparison only, not order advice.',
      ],
    },
    {
      heading: 'This is for study and play',
      paragraphs: [
        'A stock is a game of who has the money and who has the shares. The hub is the aim; fractals, strokes, segments, and buy or sell labels are only ways to see it.',
      ],
    },
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
        'A-shares try Tencent / ifzq first, then Eastmoney. US symbols try Eastmoney, then Yahoo, then Yahoo through the allorigins browser proxy if CORS blocks the direct call; daily bars may still try Stooq. There is no API key and no paid terminal. The broken Tencent US history (for example a 2011 bar and a 2026 bar) is rejected and is not used as a chart series.',
        'On a block, a timeout, or an unusable series, the page lists each source’s reason. No price is invented, and the desk does not fall back to a teaching lesson by itself. A secondary button can load a lesson if you want one.',
        'Incomplete bars are dropped. They are not repaired. No price is filled in. Volume is shown only when the feed supplied it. MACD and moving averages are indicators computed from closes, not Chanlun.',
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
        'An oscillation range (hub) is the overlap of at least three consecutive strokes, or three consecutive segments. The upper edge (ZG) is the lowest of those highs. The lower edge (ZD) is the highest of those lows. The upper edge must be strictly above the lower edge. A single-price touch is not a range. Later swings that still intersect [lower edge, upper edge] extend the range. The upper and lower edges stay fixed. The range high (GG) and range low (DD) record the highest high and lowest low of every member. A swing entirely above the upper edge leaves upward. A swing entirely below the lower edge leaves downward. The leaving swing is not a member. It can start the next range. Ranges on the same level do not share members. Ranges built from strokes and ranges built from segments are different levels and may overlap in time.',
        'A third-class buy is the first down stroke after an upward leave that stays entirely above the upper edge, marked at its low. A third-class sell is the mirror. There is no MACD divergence here, so first-class and second-class points are not labeled. On the chart the labels are the words for a third-class buy or sell, quieter than the oscillation range. The last stroke is drawn dashed and marked unconfirmed because it can still extend. Earlier strokes are solid and confirmed. A segment is confirmed when its feature-sequence fractal has ended it.',
      ],
    },
    {
      heading: 'Not an official Chan',
      paragraphs: [
        'Schools differ on inclusion direction, how many bars a stroke needs, whether a gap ends a segment, and where a hub stops. This is one consistent implementation that the lessons and the tests can check.',
        'The three chart lessons do not reach an oscillation range built from segments. Lessons 1 and 2 each carry one unfinished segment. The ending rule and the gap rule are checked in unit tests on hand-built strokes.',
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
