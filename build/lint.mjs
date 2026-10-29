// Headline lint: a prompt about people, films, songs, games or brands must name its list in
// the headline itself. Allowed: a number ("top 100", "5 or more") or a year, an award phrase
// ("winners", "champions", "nominated", "inducted"), or "all-time" or "ever" with a measure
// ("best-selling", "highest-grossing").
const NUMBER = /\b(\d[\d,]*|one|two|three|four|five|six|seven|eight|nine|ten|twenty|fifty|hundred)\b/i;
const AWARD = /\b(winners?|winning|won|champions?|laureates?|nominated|inducted|All-Stars?)\b/i;
const ALL_TIME = /all-time|of all time|\bever\b/i;
const MEASURE = /\b(best-selling|highest-grossing|most-streamed|top|best|greatest)\b/i;

export function namesItsList(headline) {
  return NUMBER.test(headline) || AWARD.test(headline) || (ALL_TIME.test(headline) && MEASURE.test(headline));
}

// The kinds of prompt the rule covers.
export const OPEN_KINDS = new Set(['people', 'media', 'games', 'brands']);
