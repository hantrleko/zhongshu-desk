import { describe, expect, it } from 'vitest';
import {
  acceptQuote,
  chooseLesson,
  initialSession,
  noteEmptySymbol,
  rejectQuote,
  requestQuote,
  shownIdentity,
} from '../src/desk/session.ts';

describe('quote session', () => {
  it('keeps the lesson on screen while a symbol is still loading', () => {
    const loading = requestQuote(initialSession('single-hub'), 'AAPL', 'D');
    expect(shownIdentity(loading)).toEqual({ kind: 'lesson', fixtureId: 'single-hub' });
    expect(loading.quote).toBeNull();
    expect(loading.attempt).toMatchObject({ status: 'loading', symbol: 'AAPL', timeframe: 'D' });
  });

  it('shows the returned symbol only after a quote arrives', () => {
    const ready = acceptQuote(requestQuote(initialSession('single-hub'), 'AAPL', 'D'), 'AAPL', 'stooq', 'D');
    expect(shownIdentity(ready)).toEqual({ kind: 'quote', symbol: 'AAPL', source: 'stooq' });
    expect(ready.attempt).toMatchObject({ status: 'ready', source: 'stooq' });
  });

  it('returns a failed AAPL read to the lesson and does not keep AAPL as the shown series', () => {
    const failed = rejectQuote(
      requestQuote(initialSession('single-hub'), 'AAPL', 'D'),
      'AAPL',
      'D',
      ['Yahoo: Failed to fetch', 'Stooq: Failed to fetch'],
      'quote',
    );
    expect(shownIdentity(failed)).toEqual({ kind: 'lesson', fixtureId: 'single-hub' });
    expect(failed.quote).toBeNull();
    expect(failed.attempt).toEqual({
      status: 'failed',
      symbol: 'AAPL',
      timeframe: 'D',
      reasons: ['Yahoo: Failed to fetch', 'Stooq: Failed to fetch'],
      kind: 'quote',
    });
  });

  it('drops a previous quote when a later symbol fails, instead of leaving that symbol drawn', () => {
    const ready = acceptQuote(initialSession('two-hubs'), 'MSFT', 'yahoo', 'D');
    const loading = requestQuote(ready, 'AAPL', 'W');
    expect(shownIdentity(loading)).toEqual({ kind: 'quote', symbol: 'MSFT', source: 'yahoo' });
    const failed = rejectQuote(loading, 'AAPL', 'W', ['Yahoo: Failed to fetch'], 'quote');
    expect(shownIdentity(failed)).toEqual({ kind: 'lesson', fixtureId: 'two-hubs' });
    expect(failed.quote).toBeNull();
    expect(failed.attempt).toMatchObject({ symbol: 'AAPL', timeframe: 'W' });
  });

  it('does not replace the drawn series when the symbol box is empty', () => {
    const ready = acceptQuote(initialSession('single-hub'), 'AAPL', 'yahoo', 'D');
    const empty = noteEmptySymbol(ready, 'D');
    expect(shownIdentity(empty)).toEqual({ kind: 'quote', symbol: 'AAPL', source: 'yahoo' });
    expect(empty.attempt).toMatchObject({ status: 'failed', kind: 'empty-symbol', symbol: '' });
  });

  it('clears a failed request when the lesson is chosen on purpose', () => {
    const failed = rejectQuote(initialSession('single-hub'), 'AAPL', 'D', ['Yahoo: Failed to fetch'], 'quote');
    const chosen = chooseLesson('no-hub');
    expect(shownIdentity(chosen)).toEqual({ kind: 'lesson', fixtureId: 'no-hub' });
    expect(chosen.attempt).toEqual({ status: 'idle' });
    expect(failed.fixtureId).toBe('single-hub');
  });
});
