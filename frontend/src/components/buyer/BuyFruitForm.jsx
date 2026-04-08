import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 🔥 ajouté
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";
import { getReadableErrorMessage } from "../../utils/handleContractError";

export default function BuyFruitForm({
  fruitId,
  price,
  stock,
  setStatus,
  refreshFruits,
}) {
  const [quantity, setQuantity] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const navigate = useNavigate(); // 🔥 ajouté

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
      const provider = new ethers.BrowserProvider(window.ethereum);

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
        setStatus("Wrong network. Please switch to Sepolia.");
        return;
      }

      setIsBuying(true);

      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const fruit = await contract.getFruit(fruitId);

      const fruitName = fruit[1]; // 🔥 ajouté
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

      const totalPriceWei = fruitPriceWei * BigInt(quantityNumber);
      const unitPriceEth = ethers.formatEther(fruitPriceWei); // 🔥 ajouté
      const totalPriceEth = ethers.formatEther(totalPriceWei); // 🔥 ajouté

      setStatus("Opening MetaMask...");

      const tx = await contract.buyFruit(fruitId, quantityNumber, {
        value: totalPriceWei,
      });

      setStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();

      setStatus("Purchase successful.");
      setQuantity("");

      if (refreshFruits) {
        await refreshFruits();
      }

      // 🔥 REDIRECTION ICI
      navigate("/purchase-success", {
        state: {
          fruitId: Number(fruitId),
          fruitName,
          quantity: quantityNumber,
          unitPrice: unitPriceEth,
          totalPrice: totalPriceEth,
          seller: fruitSeller,
          buyer: buyerAddress,
          txHash: tx.hash,
          purchasedAt: Date.now(),
        },
      });

    } catch (error) {
      console.error("Full purchase error:", error);
      setStatus(getReadableErrorMessage(error, "Error while purchasing."));
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