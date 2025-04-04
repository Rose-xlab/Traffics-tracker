export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function extractSearchTerms(query: string): string[] {
  return normalizeSearchTerm(query)
    .split(' ')
    .filter(term => term.length > 1);
}

export function buildSearchQuery(terms: string[]): string {
  return terms
    .map(term => `name.ilike.%${term}%`)
    .join(',');
}

export function highlightSearchTerms(text: string, terms: string[]): string {
  let result = text;
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  return result;
}