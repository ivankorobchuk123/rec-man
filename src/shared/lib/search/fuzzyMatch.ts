function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function fuzzyMatch(text: string, search: string): boolean {
  if (!search.trim()) return true
  const normText = normalize(text)
  const normSearch = normalize(search)
  if (normText.includes(normSearch)) return true
  const words = normSearch.split(' ')
  return words.every((word) => normText.includes(word))
}

/**
 * Smart search: matches by direct substring, all words (any order), or subsequence.
 * E.g. "fix lo" matches "Fix login bug", "bug fix" matches "Fix the login bug".
 */
export function smartMatch(text: string, search: string): boolean {
  if (!search.trim()) return true
  const normText = normalize(text)
  const normSearch = normalize(search)

  // 1. Direct substring
  if (normText.includes(normSearch)) return true

  // 2. All words present (any order)
  const words = normSearch.split(' ').filter((w) => w.length > 0)
  if (words.length > 0 && words.every((word) => normText.includes(word))) return true

  // 3. Subsequence match (chars of query appear in order) — for abbreviations, typos
  if (normSearch.length >= 2 && isSubsequence(normText, normSearch)) return true

  return false
}

function isSubsequence(text: string, query: string): boolean {
  let j = 0
  for (let i = 0; i < text.length && j < query.length; i++) {
    if (text[i] === query[j]) j++
  }
  return j === query.length
}

export function getHighlightRanges(text: string, search: string): [number, number][] {
  if (!search.trim()) return []
  const normText = text.toLowerCase()
  const normSearch = normalize(search)
  const ranges: [number, number][] = []
  let pos = 0
  while (pos < normText.length) {
    const idx = normText.indexOf(normSearch, pos)
    if (idx === -1) break
    ranges.push([idx, idx + normSearch.length])
    pos = idx + 1
  }
  return ranges
}
