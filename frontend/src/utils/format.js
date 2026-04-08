export function renderStars(rating, max = 5) {
  const r = Number(rating);

  if (!r || r <= 0) {
    return "☆".repeat(max);
  }

  return "★".repeat(r) + "☆".repeat(max - r);
}

export const FRUIT_EMOJI_MAP = [
  { keywords: ["apple"], emoji: "🍎" },
  { keywords: ["green apple"], emoji: "🍏" },
  { keywords: ["banana"], emoji: "🍌" },
  { keywords: ["orange", "mandarin", "tangerine"], emoji: "🍊" },
  { keywords: ["grape", "grapes"], emoji: "🍇" },
  { keywords: ["watermelon"], emoji: "🍉" },
  { keywords: ["strawberry"], emoji: "🍓" },
  { keywords: ["melon"], emoji: "🍈" },
  { keywords: ["cherry", "cherries"], emoji: "🍒" },
  { keywords: ["peach"], emoji: "🍑" },
  { keywords: ["pear"], emoji: "🍐" },
  { keywords: ["pineapple"], emoji: "🍍" },
  { keywords: ["kiwi"], emoji: "🥝" },
  { keywords: ["lemon"], emoji: "🍋" },
  { keywords: ["mango"], emoji: "🥭" },
  { keywords: ["coconut"], emoji: "🥥" },
  { keywords: ["avocado"], emoji: "🥑" },
  { keywords: ["tomato"], emoji: "🍅" },
  { keywords: ["blueberry", "blueberries"], emoji: "🫐" },
  { keywords: ["olive", "olives"], emoji: "🫒" },
  { keywords: ["papaya"], emoji: "🍈" },
  { keywords: ["guava"], emoji: "🍏" },
  { keywords: ["plum"], emoji: "🍑" },
  { keywords: ["pomegranate"], emoji: "🍎" },
  { keywords: ["lime"], emoji: "🍋" },
];

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getFruitEmoji(name) {
  const n = normalizeText(name);

  if (!n) return "🍏";

  for (const item of FRUIT_EMOJI_MAP) {
    for (const keyword of item.keywords) {
      const k = normalizeText(keyword);
      if (n.includes(k) || k.includes(n)) {
        return item.emoji;
      }
    }
  }

  return "🍏";
}

export function getFruitEmojiSuggestions(name, limit = 6) {
  const n = normalizeText(name);

  if (!n) {
    return FRUIT_EMOJI_MAP.slice(0, limit).map((item) => ({
      emoji: item.emoji,
      label: item.keywords[0],
    }));
  }

  const startsWith = [];
  const includes = [];

  for (const item of FRUIT_EMOJI_MAP) {
    const matchedKeyword = item.keywords.find((keyword) => {
      const k = normalizeText(keyword);
      return k.startsWith(n);
    });

    if (matchedKeyword) {
      startsWith.push({
        emoji: item.emoji,
        label: matchedKeyword,
      });
      continue;
    }

    const includedKeyword = item.keywords.find((keyword) => {
      const k = normalizeText(keyword);
      return k.includes(n) || n.includes(k);
    });

    if (includedKeyword) {
      includes.push({
        emoji: item.emoji,
        label: includedKeyword,
      });
    }
  }

  return [...startsWith, ...includes].slice(0, limit);
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}