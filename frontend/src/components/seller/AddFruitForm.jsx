import { useState } from "react";
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS } from "../../config/contract";

export default function AddFruitForm({ account, setStatus, refreshFruits }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask non installé.");
      return;
    }

    if (!account) {
      setStatus("Veuillez connecter votre wallet.");
      return;
    }

    if (!name || !price || !stock) {
      setStatus("Veuillez remplir tous les champs.");
      return;
    }

    if (Number(price) <= 0 || Number(stock) <= 0) {
      setStatus("Le prix et le stock doivent être supérieurs à 0.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Opening MetaMask...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.addFruit(
        name,
        ethers.parseEther(price),
        Number(stock)
      );

      setStatus("Transaction envoyée. En attente de confirmation...");
      await tx.wait();

      setStatus("Fruit ajouté avec succès.");

      setName("");
      setPrice("");
      setStock("");

      if (refreshFruits) {
        await refreshFruits();
      }
    } catch (error) {
      console.error(error);

      if (error.code === 4001) {
        setStatus("Transaction refusée.");
      } else {
        setStatus("Erreur lors de l'ajout du fruit.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3 className="section-title">Add fruit</h3>
      <p className="section-subtitle">
        Publish a new product with its price and stock.
      </p>

      <div className="form-row">
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Apple"
            disabled={loading}
          />
        </div>

        <div>
          <label>Price (ETH)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.01"
            disabled={loading}
          />
        </div>

        <div>
          <label>Stock</label>
          <input
            type="number"
            min="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="10"
            disabled={loading}
          />
        </div>
      </div>

      <div className="button-group" style={{ marginTop: "16px" }}>
        <button type="button" 
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={loading}>
          {loading ? "Adding..." : "Add fruit"}
        </button>
      </div>
    </div>
  );
}