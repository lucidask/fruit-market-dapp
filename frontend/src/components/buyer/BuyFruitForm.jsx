import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS } from "../../config/contract";
import { getReadableErrorMessage } from "../../utils/handleContractError";
import { getProviderAndSigner } from "../../utils/web3";

export default function BuyFruitForm({
  fruitId,
  stock,
  setStatus,
  account,
  refreshFruits,
  buyingFruitId,
  setBuyingFruitId,
}) {
  const [quantity, setQuantity] = useState("");
  const isBuying = buyingFruitId === fruitId;
  const isAnotherBuyInProgress =
    buyingFruitId !== null && buyingFruitId !== fruitId;
  const navigate = useNavigate();

  const handleBuy = async () => {
    if (buyingFruitId != null) return;

    if (!account) {
      setStatus("Please connect your wallet.");
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
      const { provider, signer } = await getProviderAndSigner(setStatus);
      if (!provider || !signer) return;

      setBuyingFruitId(fruitId);

      const buyerAddress = await signer.getAddress();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const fruit = await contract.getFruit(fruitId);

      const fruitName = fruit[1];
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
      const unitPriceEth = ethers.formatEther(fruitPriceWei);
      const totalPriceEth = ethers.formatEther(totalPriceWei);

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
      setBuyingFruitId(null);
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
        disabled={isBuying || isAnotherBuyInProgress}
        style={{
          width: "70px",
          padding: "6px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          opacity: isBuying || isAnotherBuyInProgress ? 0.7 : 1,
          cursor: isBuying || isAnotherBuyInProgress ? "not-allowed" : "text",
        }}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleBuy();
        }}
        disabled={isBuying || isAnotherBuyInProgress}
      >
        {isBuying ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}
