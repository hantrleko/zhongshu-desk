import type { Timeframe } from '../data/resample.ts';

export type QuoteSource = 'yahoo' | 'stooq';

export type Attempt =
  | { status: 'idle' }
  | { status: 'loading'; symbol: string; timeframe: Timeframe }
  | {
      status: 'failed';
      symbol: string;
      timeframe: Timeframe;
      reasons: string[];
      kind: 'quote' | 'bad-symbol' | 'empty-symbol';
    }
  | { status: 'ready'; symbol: string; source: QuoteSource; timeframe: Timeframe };

export interface Session {
  fixtureId: string;
  /** Present only after a public quote actually arrived. A failed read clears it. */
  quote: { symbol: string; source: QuoteSource } | null;
  attempt: Attempt;
}

export type ShownIdentity =
  | { kind: 'lesson'; fixtureId: string }
  | { kind: 'quote'; symbol: string; source: QuoteSource };

export function initialSession(fixtureId: string): Session {
  return { fixtureId, quote: null, attempt: { status: 'idle' } };
}

/** The series on the chart. A request in flight does not change this. */
export function shownIdentity(session: Session): ShownIdentity {
  if (session.quote) return { kind: 'quote', symbol: session.quote.symbol, source: session.quote.source };
  return { kind: 'lesson', fixtureId: session.fixtureId };
}

export function chooseLesson(fixtureId: string): Session {
  return { fixtureId, quote: null, attempt: { status: 'idle' } };
}

/** Record a request and leave the drawn series alone. */
export function requestQuote(session: Session, symbol: string, timeframe: Timeframe): Session {
  return { ...session, attempt: { status: 'loading', symbol, timeframe } };
}

export function acceptQuote(session: Session, symbol: string, source: QuoteSource, timeframe: Timeframe): Session {
  return {
    ...session,
    quote: { symbol, source },
    attempt: { status: 'ready', symbol, source, timeframe },
  };
}

/**
 * A failed public read is never drawn as that symbol.
 * The chart returns to the current lesson. The symbol stays on the attempt only.
 */
export function rejectQuote(
  session: Session,
  symbol: string,
  timeframe: Timeframe,
  reasons: string[],
  kind: 'quote' | 'bad-symbol',
): Session {
  return {
    fixtureId: session.fixtureId,
    quote: null,
    attempt: { status: 'failed', symbol, timeframe, reasons, kind },
  };
}

/** An empty box does not replace the series already on the chart. */
export function noteEmptySymbol(session: Session, timeframe: Timeframe): Session {
  return {
    ...session,
    attempt: { status: 'failed', symbol: '', timeframe, reasons: [], kind: 'empty-symbol' },
  };
}
