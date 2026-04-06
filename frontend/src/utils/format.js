export function renderStars(rating, max = 5) {
  const r = Number(rating);

  if (!r || r <= 0) {
    return "☆".repeat(max);
  }

  return "★".repeat(r) + "☆".repeat(max - r);
}

export function getFruitEmoji(name) {
  const n = name.toLowerCase();

  if (n.includes("pineapple")) return "🍍";
  if (n.includes("apple")) return "🍎";
  if (n.includes("banana")) return "🍌";
  if (n.includes("orange")) return "🍊";
  if (n.includes("grape")) return "🍇";
  if (n.includes("peach")) return "🍑";
  if (n.includes("pear")) return "🍐";
  if (n.includes("watermelon")) return "🍉";
  if (n.includes("strawberry")) return "🍓";
  if (n.includes("lemon")) return "🍋";
  if (n.includes("cherry")) return "🍒";

  return "🍏"; // fallback
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}