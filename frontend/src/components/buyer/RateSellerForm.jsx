import { useState } from "react";
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";
import { getReadableErrorMessage } from "../../utils/handleContractError";

export default function RateSellerForm({
  seller,
  setStatus,
  refreshFruits,
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [isRating, setIsRating] = useState(false);

  const handleRate = async () => {
    if (isRating) return;

    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setStatus("Rating must be between 1 and 5.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
        setStatus("Wrong network. Please switch to Sepolia.");
        return;
      }

      setIsRating(true);

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      setStatus("Opening MetaMask...");

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
      setStatus(getReadableErrorMessage(error, "Error while submitting rating."));
    } finally {
      setIsRating(false);
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
          opacity: isRating ? 0.7 : 1,
          pointerEvents: isRating ? "none" : "auto",
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
            disabled={isRating}
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
        disabled={isRating}
      >
        {isRating ? "Rating..." : "Rate"}
      </button>
    </div>
  );
}