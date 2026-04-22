import { useState } from "react";
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS } from "../../config/contract";
import { getReadableErrorMessage } from "../../utils/handleContractError";
import { getProviderAndSigner, hasEnoughGas } from "../../utils/web3";

export default function RateSellerForm({
  seller,
  setStatus,
  account,
  refreshFruits,
  ratingSellerId,
  setRatingSellerId,
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const isRating = ratingSellerId === seller;
  const isAnotherRatingInProgress =
    ratingSellerId !== null && ratingSellerId !== seller;

  const handleRate = async () => {
    if (ratingSellerId !== null) return;

    if (!account) {
      setStatus("Please connect your wallet.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setStatus("Rating must be between 1 and 5.");
      return;
    }

    try {
      const { signer } = await getProviderAndSigner(setStatus);
      if (!signer) return;

      setRatingSellerId(seller);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      setStatus("Opening MetaMask...");

      const txRequest = await contract.rateSeller.populateTransaction(
        seller,
        rating,
      );

      const ok = await hasEnoughGas(txRequest, signer);
      if (!ok) {
        setStatus("Insufficient funds for gas.");
        return;
      }

      const tx = await contract.rateSeller(seller, rating);

      setStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();

      setStatus("Rating submitted successfully.");
      setRating(0);
      setHovered(0);

      if (refreshFruits) {
        await refreshFruits();
      }
    } catch (error) {
      console.error("Full rating error:", error);
      setStatus(
        getReadableErrorMessage(error, "Error while submitting rating."),
      );
    } finally {
      setRatingSellerId(seller);
    }
  };

  const activeValue = hovered || rating;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          opacity: isRating || isAnotherRatingInProgress ? 0.7 : 1,
          pointerEvents:
            isRating || isAnotherRatingInProgress ? "none" : "auto",
        }}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRating(value);
            }}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            disabled={isRating || isAnotherRatingInProgress}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: isRating ? "not-allowed" : "pointer",
              fontSize: "22px",
              lineHeight: 1,
              color: value <= activeValue ? "#f59e0b" : "#d1d5db",
            }}
            aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
            title={`${value}/5`}
          >
            ★
          </button>
        ))}
      </div>

      <span
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          minWidth: "36px",
        }}
      >
        {rating ? `${rating}/5` : ""}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleRate();
        }}
        disabled={isRating || isAnotherRatingInProgress}
      >
        {isRating ? "Rating..." : "Rate"}
      </button>
    </div>
  );
}
