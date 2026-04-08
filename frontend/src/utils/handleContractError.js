export function getReadableErrorMessage(error, fallback = "An error occurred.") {
  const reason =
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.message ||
    "";

  const normalized = reason.toLowerCase();

  if (error?.code === 4001 || normalized.includes("user rejected")) {
    return "Transaction rejected.";
  }

  if (normalized.includes("insufficient funds")) {
    return "Insufficient funds.";
  }

  if (normalized.includes("incorrect payment")) {
    return "Incorrect payment.";
  }

  if (normalized.includes("fruit inactive")) {
    return "Product unavailable.";
  }

  if (normalized.includes("not enough stock")) {
    return "Insufficient stock.";
  }

  if (normalized.includes("invalid fruit id")) {
    return "Invalid fruit.";
  }

  if (normalized.includes("must buy before rating")) {
    return "You must buy from this seller before rating.";
  }

  if (normalized.includes("already rated")) {
    return "You have already rated this seller.";
  }

  if (normalized.includes("rating must be")) {
    return "Rating must be between 1 and 5.";
  }

  return fallback;
}