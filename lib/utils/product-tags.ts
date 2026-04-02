function normalizeTagValue(tag: string) {
  return tag.trim().toLowerCase();
}

const nonTagWords = new Set([
  "account",
  "accounts",
  "bundle",
  "card",
  "cards",
  "digital",
  "pack",
  "product",
  "products",
  "starter",
  "suite",
]);

function tokenize(text: string) {
  return text
    .split(/[^a-zA-Z0-9]+/)
    .map((token) => normalizeTagValue(token))
    .filter((token) => token.length > 2 && !nonTagWords.has(token));
}

export function buildProductTags({
  category,
  name,
  providedTags = [],
  subcategory,
}: {
  category: string;
  name: string;
  providedTags?: string[];
  subcategory?: string;
}) {
  const tags = [
    ...providedTags,
    category,
    ...(subcategory ? [subcategory] : []),
    ...tokenize(name),
    ...(subcategory ? tokenize(subcategory) : []),
  ];

  return tags.filter((tag, index) => {
    const normalizedTag = normalizeTagValue(tag);
    if (!normalizedTag) {
      return false;
    }

    return tags.findIndex((candidate) => normalizeTagValue(candidate) === normalizedTag) === index;
  });
}

export function normalizeTag(tag: string) {
  return normalizeTagValue(tag);
}
