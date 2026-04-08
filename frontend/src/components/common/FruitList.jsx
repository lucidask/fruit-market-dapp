import BuyFruitForm from "../buyer/BuyFruitForm";
import RateSellerForm from "../buyer/RateSellerForm";
import { ethers } from "ethers";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS } from "../../config/contract";
import Card from "./Card";
import { useState } from "react";
import DeleteConfirmModal from "../seller/DeleteConfirmModal";
import UpdateFruitModal from "../seller/UpdateFruitModal";
import { renderStars, getFruitEmoji, shortenAddress } from "../../utils/format";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function FruitList({
  fruits,
  account,
  isV2,
  setStatus,
  refreshFruits,
  mode,
  highlightId,
}) {
  const [fruitToDelete, setFruitToDelete] = useState(null);
  const [fruitToEdit, setFruitToEdit] = useState(null);
  const [updatingFruitId, setUpdatingFruitId] = useState(null);
  const [deletingFruitId, setDeletingFruitId] = useState(null);
  const navigate = useNavigate();

  const handleRemove = async (fruitId) => {
    if (!window.ethereum) {
      setStatus("MetaMask non installé.");
      return;
    }

    try {
      setDeletingFruitId(fruitId);
      setStatus("Opening MetaMask...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.removeFruit(fruitId);

      setStatus("Transaction envoyée. En attente de confirmation...");
      await tx.wait();

      setStatus("Fruit supprimé avec succès.");

      if (refreshFruits) {
        await refreshFruits();
      }
    } catch (error) {
      console.error(error);

      if (error.code === 4001) {
        setStatus("Transaction refusée.");
      } else {
        setStatus("Erreur lors de la suppression.");
      }
    } finally {
      setDeletingFruitId(null);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>

      {fruits.length === 0 ? (
        <p>No Fruit Available</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 300px))",
              justifyContent: "center",
            gap: "16px",
            alignItems: "stretch",
          }}
        >
      {fruits.map((fruit) => {
        const isSeller =
          account && fruit.seller.toLowerCase() === account.toLowerCase();

        const isDeleted = !fruit.active;
        const isOutOfStock = Number(fruit.stock) <= 0;
        const isUnavailableForBuyer = isDeleted || isOutOfStock;
        const ratingValue = Number(fruit.sellerRating) || 0;
        const isHighlighted = highlightId && Number(highlightId) === fruit.id;

        if (!fruit.active && mode !== "seller") return null;

        return (
          <div
            key={fruit.id}
            ref={
              isHighlighted
                ? (el) => {
                    if (el) {
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }
                : null
            }
          >
            <Card
              onClick={() => {
                if (mode !== "buyer") {
                  navigate(`/fruit/${fruit.id}`);
                }
              }}
              style={{
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                border: isHighlighted
                  ? "2px solid #6366f1"
                  : "1px solid var(--border)",
                boxShadow: isHighlighted
                  ? "0 0 0 3px rgba(99,102,241,0.2)"
                  : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      marginBottom: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "18px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>
                      {getFruitEmoji(fruit.name)}
                    </span>
                    {fruit.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    {fruit.price} ETH
                  </p>
                </div>

                {mode !== "buyer" && (
                  <span
                    className={
                      fruit.active ? "badge badge-success" : "badge badge-danger"
                    }
                    style={{
                      alignSelf: "flex-start",
                      lineHeight: 1.2,
                    }}
                  >
                    {fruit.active ? "Active" : "Deleted"}
                  </span>
                )}
              </div>

              <div
                style={{
                  marginBottom: "12px",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {mode === "seller" ? (
                  <p>
                    <strong>Stock :</strong> {fruit.stock}
                  </p>
                ) : mode === "marketplace" ? (
                  <p>
                    <strong>Availability :</strong>
                    {fruit.stock === 0 ? (
                      <span className="badge badge-danger">❌ Out of Stock</span>
                    ) : fruit.stock <= 5 ? (
                      <span className="badge badge-warning">⚠ Low Stock</span>
                    ) : (
                      <span className="badge badge-success">✔ In Stock</span>
                    )}
                  </p>
                ) : null}

                <p title={fruit.seller} style={{ marginBottom: "6px" }}>
                  <strong>Seller:</strong> {shortenAddress(fruit.seller)}
                </p>

                {fruit.myPurchase > 0 && (
                  <p>
                    <strong>Purchased :</strong> {fruit.myPurchase}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {isSeller && (
                    <span className="badge badge-warning">Your Fruit</span>
                  )}

                  {isV2 && mode === "buyer" && fruit.alreadyRated && (
                    <span className="badge badge-success">✔ Rated</span>
                  )}

                  {isHighlighted && mode === "seller" && (
                    <span className="badge badge-success">Selected</span>
                  )}
                </div>

                {isV2 && ratingValue > 0 && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "6px",
                      padding: "4px 8px",
                      border: "1px solid var(--border)",
                      borderRadius: "999px",
                      backgroundColor: "#fffaf0",
                      maxWidth: "fit-content",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#f59e0b",
                        letterSpacing: "1px",
                        lineHeight: 1,
                      }}
                    >
                      {renderStars(ratingValue)}
                    </span>

                    <span
                      style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                      {ratingValue}/5
                    </span>
                  </div>
                )}

                {!isDeleted && isOutOfStock && (
                  <p style={{ color: "var(--danger)", fontWeight: "600" }}>
                    Out of Stock
                  </p>
                )}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Actions
                </p>

                {!isSeller && mode !== "buyer" && !isUnavailableForBuyer && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BuyFruitForm
                      fruitId={fruit.id}
                      price={fruit.price}
                      stock={fruit.stock}
                      setStatus={setStatus}
                      refreshFruits={refreshFruits}
                    />
                  </div>
                )}

                {mode === "buyer" &&
                  !isSeller &&
                  isV2 &&
                  fruit.myPurchase > 0 &&
                  !fruit.alreadyRated && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RateSellerForm
                        seller={fruit.seller}
                        setStatus={setStatus}
                        refreshFruits={refreshFruits}
                      />
                    </div>
                  )}

                {mode === "seller" && isSeller && !isDeleted && (
                  <div
                    className="button-group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="button-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFruitToEdit(fruit);
                      }}
                      disabled={
                        updatingFruitId === fruit.id || deletingFruitId === fruit.id
                      }
                    >
                      {updatingFruitId === fruit.id ? "Updating..." : "Update"}
                    </button>

                    <button
                      className="button-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFruitToDelete(fruit);
                      }}
                      disabled={
                        updatingFruitId === fruit.id || deletingFruitId === fruit.id
                      }
                    >
                      {deletingFruitId === fruit.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );
      })}
          </div>
      )}

      <DeleteConfirmModal
        isOpen={!!fruitToDelete}
        fruitName={fruitToDelete?.name}
        onClose={() => setFruitToDelete(null)}
        onConfirm={async () => {
          if (!fruitToDelete) return;

          const fruitId = fruitToDelete.id;
          setFruitToDelete(null);
          await handleRemove(fruitId);
        }}
      />

      <UpdateFruitModal
        isOpen={!!fruitToEdit}
        fruit={fruitToEdit}
        onClose={() => setFruitToEdit(null)}
        setStatus={setStatus}
        refreshFruits={refreshFruits}
        setUpdatingFruitId={setUpdatingFruitId}
      />
    </div>
  );
}