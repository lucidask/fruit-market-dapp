import { useEffect, useState } from "react";
import { ethers } from "ethers";

import Modal from "../common/Modal";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS } from "../../config/contract";
import {
  getProviderAndSigner,
  handleWeb3Error,
  hasEnoughGas,
} from "../../utils/web3";

export default function UpdateFruitModal({
  isOpen,
  fruit,
  onClose,
  setStatus,
  account,
  refreshFruits,
  updatingFruitId,
  setUpdatingFruitId,
}) {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const isUpdating = updatingFruitId === fruit?.id;
  const isAnotherUpdateInProgress =
    updatingFruitId !== null && updatingFruitId !== fruit?.id;

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
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

  const handleUpdate = async () => {
    if (!fruit) return;
    if (updatingFruitId !== null) return;

    if (!account) {
      setStatus("Please connect your wallet.");
      return;
    }

    if (!price || !stock) {
      setStatus("Please fill in all fields.");
      return;
    }

    try {
      setUpdatingFruitId(fruit.id);

      onClose();
      await waitForUiClose();

      setStatus("Opening MetaMask...");

      const { signer } = await getProviderAndSigner(setStatus);
      if (!signer) return;

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const txRequest = await contract.updateFruit.populateTransaction(
        fruit.id,
        ethers.parseEther(price),
        Number(stock),
      );

      const ok = await hasEnoughGas(txRequest, signer);
      if (!ok) {
        setStatus("Insufficient funds for gas.");
        return;
      }

      const tx = await contract.updateFruit(
        fruit.id,
        ethers.parseEther(price),
        Number(stock),
      );

      setStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();

      setStatus("Fruit updated successfully.");

      if (refreshFruits) {
        await refreshFruits();
      }
    } catch (error) {
      handleWeb3Error(error, setStatus, "update fruit");
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
            disabled={isUpdating || isAnotherUpdateInProgress}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div>
          <label>Stock</label>
          <input
            type="number"
            min="0"
            value={stock}
            disabled={isUpdating || isAnotherUpdateInProgress}
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

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleUpdate();
          }}
          disabled={isUpdating || isAnotherUpdateInProgress}
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
}
