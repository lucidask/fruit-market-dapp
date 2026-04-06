import { useState } from "react";
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";

export default function BuyFruitForm({
  fruitId,
  price,
  stock,
  setStatus,
  refreshFruits,
}) {
  const [quantity, setQuantity] = useState("");
  const [isBuying, setIsBuying] = useState(false);

  const handleBuy = async () => {
    if (isBuying) return;

    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
      return;
    }

    const quantityNumber = Number(quantity);

    if (!quantity || quantityNumber <= 0) {
      setStatus("Please enter a valid quantity.");
      return;
    }

    if (quantityNumber > Number(stock)) {
      setStatus("Requested quantity exceeds available stock.");
      return;
    }

    try {
      setIsBuying(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
        setStatus("Wrong network. Please switch to Sepolia.");
        return;
      }

      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const fruit = await contract.getFruit(fruitId);

      const fruitPriceWei = fruit[2];
      const fruitStock = Number(fruit[3]);
      const fruitSeller = fruit[4];
      const fruitActive = fruit[5];

      if (!fruitActive) {
        setStatus("Product unavailable.");
        return;
      }

      if (fruitStock < quantityNumber) {
        setStatus("Insufficient stock.");
        return;
      }

      if (fruitSeller.toLowerCase() === buyerAddress.toLowerCase()) {
        setStatus("The seller cannot buy their own fruit.");
        return;
      }

      const totalPrice = fruitPriceWei * BigInt(quantityNumber);

      setStatus("Opening MetaMask...");

      const tx = await contract.buyFruit(fruitId, quantityNumber, {
        value: totalPrice,
      });

      setStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();

      setStatus("Purchase successful.");
      setQuantity("");

      if (refreshFruits) {
        await refreshFruits();
      }
    } catch (error) {
      console.error("Full purchase error:", error);

      const reason =
        error?.reason ||
        error?.shortMessage ||
        error?.info?.error?.message ||
        error?.message ||
        "";

      const normalizedReason = reason.toLowerCase();

      if (error?.code === 4001 || normalizedReason.includes("user rejected")) {
        setStatus("Transaction rejected.");
      } else if (normalizedReason.includes("insufficient funds")) {
        setStatus("Insufficient funds to pay for the purchase or gas fees.");
      } else if (normalizedReason.includes("incorrect payment")) {
        setStatus("Incorrect payment amount.");
      } else if (normalizedReason.includes("fruit inactive")) {
        setStatus("Product unavailable.");
      } else if (normalizedReason.includes("not enough stock")) {
        setStatus("Insufficient stock.");
      } else if (normalizedReason.includes("invalid fruit id")) {
        setStatus("Invalid fruit.");
      } else if (normalizedReason.includes("execution reverted")) {
        setStatus(`Transaction rejected: ${reason}`);
      } else {
        setStatus("Error while purchasing.");
      }
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <input
        type="number"
        min="1"
        max={stock}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Qty"
        disabled={isBuying}
        style={{
          width: "70px",
          padding: "6px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          opacity: isBuying ? 0.7 : 1,
          cursor: isBuying ? "not-allowed" : "text",
        }}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleBuy();
        }}
        disabled={isBuying}
      >
        {isBuying ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}