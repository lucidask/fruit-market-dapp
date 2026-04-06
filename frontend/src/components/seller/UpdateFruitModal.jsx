import { useEffect, useState } from "react";
import { ethers } from "ethers";

import Modal from "../common/Modal";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS } from "../../config/contract";

export default function UpdateFruitModal({
  isOpen,
  fruit,
  onClose,
  setStatus,
  refreshFruits,
  setUpdatingFruitId,
}) {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  useEffect(() => {
    if (fruit) {
      setPrice(fruit.price?.toString() || "");
      setStock(fruit.stock?.toString() || "");
    } else {
      setPrice("");
      setStock("");
    }
  }, [fruit]);

  const waitForUiClose = () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

  const handleUpdate = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask non installé.");
      return;
    }

    if (!fruit) return;

    if (!price || !stock) {
      setStatus("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setUpdatingFruitId(fruit.id);

      onClose();
      await waitForUiClose();

      setStatus("Opening MetaMask...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.updateFruit(
        fruit.id,
        ethers.parseEther(price),
        Number(stock)
      );

      setStatus("Transaction envoyée. En attente de confirmation...");
      await tx.wait();

      setStatus("Fruit mis à jour avec succès.");

      if (refreshFruits) {
        await refreshFruits();
      }
    } catch (error) {
      console.error(error);

      if (error.code === 4001) {
        setStatus("Transaction refusée.");
      } else {
        setStatus("Erreur lors de la mise à jour.");
      }
    } finally {
      setUpdatingFruitId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Update fruit" onClose={onClose}>
      <div className="form-row">
        <div>
          <label>Price (ETH)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div>
          <label>Stock</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>

      <div className="button-group" style={{ marginTop: "16px" }}>
        <button
          type="button"
          className="button-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          Cancel
        </button>

        <button type="button" 
        onClick={(e) => {
          e.stopPropagation();
          handleUpdate();
        }}>
          Save changes
        </button>
      </div>
    </Modal>
  );
}