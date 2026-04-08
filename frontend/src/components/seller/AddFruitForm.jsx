import { useMemo, useState } from "react";
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS } from "../../config/contract";
import {
  getFruitEmoji,
  getFruitEmojiSuggestions,
} from "../../utils/format";

export default function AddFruitForm({ account, setStatus, refreshFruits }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);

  const previewEmoji = useMemo(() => getFruitEmoji(name), [name]);
  const suggestions = useMemo(() => getFruitEmojiSuggestions(name, 4), [name]);

  const handleSubmit = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
      return;
    }

    if (!account) {
      setStatus("Please connect your wallet.");
      return;
    }

    if (!name || !price || !stock) {
      setStatus("Please fill in all fields.");
      return;
    }

    if (Number(price) <= 0 || Number(stock) <= 0) {
      setStatus("Price and stock must be greater than 0.");
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

      setStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();

      setStatus("Fruit added successfully.");

      setName("");
      setPrice("");
      setStock("");

      if (refreshFruits) {
        await refreshFruits();
      }
    } catch (error) {
      console.error(error);

      if (error.code === 4001) {
        setStatus("Transaction rejected.");
      } else {
        setStatus("Error while adding fruit.");
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apple"
              disabled={loading}
            />

            <div
              title="Emoji preview"
              style={{
                width: "46px",
                height: "46px",
                minWidth: "46px",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                background: "#fafafa",
                flexShrink: 0,
              }}
            >
              {previewEmoji}
            </div>
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(72px, max-content))",
              gap: "8px",
              justifyContent: "start",
              alignItems: "center",
            }}
          >
            <div className="fruit-suggestions">
              {suggestions.map((item, index) => (
                <button
                  key={`${item.label ?? "fruit"}-${index}`}
                  type="button"
                  className="fruit-suggestion-chip"
                  disabled={loading}
                  onClick={() => setName(item.label ?? "")}
                  title={`Use ${item.label ?? "fruit"}`}
                >
                  <span className="fruit-suggestion-emoji">{item.emoji}</span>
                  <span>{item.label ?? "fruit"}</span>
                </button>
              ))}
            </div>
          </div>
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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add fruit"}
        </button>
      </div>
    </div>
  );
}