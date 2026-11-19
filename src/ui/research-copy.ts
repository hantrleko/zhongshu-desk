import type { Lang } from '../i18n.ts';
import type { ReferenceLevel, Research, Trend } from './research.ts';
import { formatPercent, formatPrice } from '../format.ts';

const zh = {
  title: '技术研判', levels: '关键价位', comparison: '日周对照', structure: '缠论结构明细',
  tools: '图表设置', recent: '近 90 根', all: '全部历史', observations: '指标依据',
  levelName: { rangeHigh: '前 20 根高点', rangeLow: '前 20 根低点', hubHigh: '最近中枢上沿', hubLow: '最近中枢下沿' },
  trend: { rising: '价格站上均线，均线向上', falling: '价格低于均线，均线向下', mixed: '价格与均线方向尚不一致', insufficient: '趋势判断所需样本不足' },
  missing: '样本不足', noVolume: '成交量不可比', pending: '正在获取', unavailable: '该周期暂无可用数据',
  empty: '暂无可用价格，待行情载入后计算。',
  distance: '距末根收盘', above: '上方参考', below: '下方参考', at: '价格重合', provisional: '含待确认结构',
  levelTip: '定位对应区间并显示参考线', evidenceTip: '显示均线并定位最近 21 根 K 线',
  ma: 'MA20', momentum: 'DIF / DEA', volume: '相对量', deviation: '均线乖离',
  limits: '以末根 K 线收盘字段计算；末根可能尚未收定。指标仅作技术对照，不等同于缠论信号。',
  pairNote: '各周期独立取数，来源与覆盖期可能不同；末根日线及本周周线均可能更新。',
  levelNote: '按距末根收盘的绝对幅度排序。参考价位不代表确定的支撑或阻力。',
  definition: 'MA20 为最近 20 根收盘均值，方向比较前一根 MA20。前 20 根高低点不含末根；相对量为末根成交量 ÷ 此前 20 根均量，未收定时不可与完整周期直接等量比较。MACD 柱为 DIF − DEA，未乘 2；不据此推断背驰。',
};
const en: typeof zh = {
  title: 'Technical assessment', levels: 'Reference levels', comparison: 'Daily / weekly', structure: 'Chan structure detail',
  tools: 'Chart settings', recent: 'Last 90 bars', all: 'Full history', observations: 'Indicator evidence',
  levelName: { rangeHigh: 'Prior 20-bar high', rangeLow: 'Prior 20-bar low', hubHigh: 'Latest hub upper', hubLow: 'Latest hub lower' },
  trend: { rising: 'Price above a rising average', falling: 'Price below a falling average', mixed: 'Price and average direction diverge', insufficient: 'Insufficient trend history' },
  missing: 'Insufficient history', noVolume: 'Volume not comparable', pending: 'Loading', unavailable: 'Timeframe unavailable',
  empty: 'Assessment awaits available prices.',
  distance: 'From last bar close', above: 'Upper reference', below: 'Lower reference', at: 'At close', provisional: 'Includes provisional structure',
  levelTip: 'Locate the evidence window and display a reference line', evidenceTip: 'Show moving averages and the last 21 bars',
  ma: 'MA20', momentum: 'DIF / DEA', volume: 'Relative volume', deviation: 'MA deviation',
  limits: 'Calculated from the last bar close field, which may not be final. Indicators are not Chan signals.',
  pairNote: 'Independent feeds and history windows may differ. The latest daily and weekly bars may still update.',
  levelNote: 'Sorted by absolute distance from the last bar close. Levels are references, not assured support or resistance.',
  definition: 'MA20 averages the latest 20 closes; direction compares the previous MA20. The prior 20-bar range excludes the latest bar. Relative volume is latest volume / prior 20-bar mean; an unfinished period is not directly comparable to full periods. MACD histogram = DIF − DEA, not doubled. No divergence inference is made.',
};
export function researchCopy(lang: Lang): typeof zh { return lang === 'zh' ? zh : en; }
export function trendTitle(trend: Trend, lang: Lang): string { return researchCopy(lang).trend[trend]; }

export function researchCommentary(r: Research, lang: Lang): string {
  if (r.close === undefined) return researchCopy(lang).empty;
  if (r.ma20 === undefined || r.maSlope === undefined) return lang === 'zh'
    ? `当前 ${r.bars} 根 K 线，尚不足以比较 MA20 的相邻变化；暂不作趋势归纳。`
    : `${r.bars} bars are available; adjacent MA20 values are required for a trend assessment.`;
  const price = formatPrice(r.close), ma = formatPrice(r.ma20);
  if (lang === 'zh') {
    const relation = r.close > r.ma20 ? '高于' : r.close < r.ma20 ? '低于' : '等于';
    const slope = r.maSlope > 0 ? '上移' : r.maSlope < 0 ? '下移' : '持平';
    const conclusion = r.trend === 'rising' ? '价格与均线方向一致，技术形态偏强。'
      : r.trend === 'falling' ? '价格与均线方向一致，技术形态偏弱。' : '价格位置与均线方向未形成同向确认。';
    return `末根收盘 ${price}，${relation} MA20（${ma}），均线较前一根${slope}。${conclusion}`;
  }
  const relation = r.close > r.ma20 ? 'above' : r.close < r.ma20 ? 'below' : 'equal to';
  const slope = r.maSlope > 0 ? 'rising' : r.maSlope < 0 ? 'falling' : 'flat';
  return `Last bar close ${price} is ${relation} MA20 (${ma}); the average is ${slope} versus the prior bar. ` +
    (r.trend === 'mixed' ? 'Price and average direction do not confirm one another.' : 'Price and average direction are aligned.');
}

export function rangeAssessment(r: Research, lang: Lang): string {
  if (!r.rangePosition) return researchCopy(lang).missing;
  if (lang === 'zh') {
    if (r.rangePosition === 'inside') return '末根收盘仍在此前 20 根高低区间内，尚未满足区间突破或跌破条件。';
    return r.rangePosition === 'above'
      ? '末根收盘字段已高于此前 20 根高点；若末根尚未收定，不宜据此确认收盘突破。'
      : '末根收盘字段已低于此前 20 根低点；若末根尚未收定，不宜据此确认收盘跌破。';
  }
  if (r.rangePosition === 'inside') return 'The last close remains within the prior 20-bar range; neither break condition is met.';
  return `The last close field is ${r.rangePosition} the prior 20-bar range. An unfinished bar does not confirm a closing break.`;
}

export function scenarioText(r: Research, lang: Lang): { upper: string; lower: string } | null {
  if (!r.range) return null;
  const high = formatPrice(r.range.high), low = formatPrice(r.range.low);
  return lang === 'zh' ? {
    upper: `向上观察：后续收盘若高于 ${high}，构成对前 20 根高点的突破；回落至该位或以下，则不再满足突破条件。`,
    lower: `向下观察：后续收盘若低于 ${low}，构成对前 20 根低点的跌破；回升至该位或以上，则不再满足跌破条件。`,
  } : {
    upper: `Upper test: a later close above ${high} breaks the prior 20-bar high. A return to or below it invalidates that condition.`,
    lower: `Lower test: a later close below ${low} breaks the prior 20-bar low. A return to or above it invalidates that condition.`,
  };
}
export function levelPosition(level: ReferenceLevel, lang: Lang): string {
  const c = researchCopy(lang);
  return `${level.distance > 0 ? c.above : level.distance < 0 ? c.below : c.at} · ${formatPercent(level.distance)}`;
}
