import { mapSymbol, type PublicQuote } from '../data/quote.ts';
import type { Timeframe } from '../data/resample.ts';
import { validResearchBars } from './research.ts';

export type ComparisonRow = { timeframe: 'D' | 'W' } & (
  { status: 'loading' | 'unavailable' } | { status: 'ready'; quote: PublicQuote }
);

export function matchesQuote(quote: PublicQuote, symbol: string, timeframe: Timeframe): boolean {
  return quote.timeframe === timeframe && mapSymbol(quote.display).display === mapSymbol(symbol).display &&
    validResearchBars(quote.bars);
}

/** Each result is independent. A late result may never overwrite a newer instrument. */
export async function loadComparison(
  primary: PublicQuote,
  load: (symbol: string, timeframe: Timeframe) => Promise<PublicQuote>,
  publish: (row: ComparisonRow) => void,
  isCurrent: () => boolean,
): Promise<void> {
  await Promise.all((['D', 'W'] as const).map(async timeframe => {
    if (!isCurrent()) return;
    if (primary.timeframe === timeframe) {
      publish({ timeframe, status: 'ready', quote: primary });
      return;
    }
    publish({ timeframe, status: 'loading' });
    try {
      const quote = await load(primary.display, timeframe);
      if (!matchesQuote(quote, primary.display, timeframe)) throw new Error('Mismatched comparison');
      if (isCurrent()) publish({ timeframe, status: 'ready', quote });
    } catch {
      if (isCurrent()) publish({ timeframe, status: 'unavailable' });
    }
  }));
}
