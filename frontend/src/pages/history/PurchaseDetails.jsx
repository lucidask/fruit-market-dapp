import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ethers } from "ethers";

import ToastMessage from "../../components/common/ToastMessage";
import Card from "../../components/common/Card";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";
import { shortenAddress, renderStars } from "../../utils/format";
import { getBrowserProvider, checkSupportedNetwork } from "../../utils/web3";

export default function PurchaseDetails({ account, status, setStatus, isV2 }) {
  const { index } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentFruit, setCurrentFruit] = useState(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const findPurchaseTxHash = async (contract, buyerAddress, targetIndex) => {
    const count = Number(await contract.getPurchaseHistoryCount());

    const historyItems = [];
    for (let i = 0; i < count; i++) {
      const item = await contract.getPurchaseHistoryItem(i);
      historyItems.push({
        fruitId: BigInt(item[0]),
        quantity: BigInt(item[4]),
        totalPrice: BigInt(item[6]),
      });
    }

    const logs = await contract.queryFilter(
      contract.filters.FruitPurchased(null, buyerAddress),
    );

    const sortedLogs = [...logs].sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      return a.index - b.index;
    });

    let logPointer = 0;

    for (
      let historyIndex = 0;
      historyIndex < historyItems.length;
      historyIndex++
    ) {
      const record = historyItems[historyIndex];

      while (logPointer < sortedLogs.length) {
        const log = sortedLogs[logPointer];
        const fruitId = BigInt(log.args.fruitId);
        const quantity = BigInt(log.args.quantity);
        const totalPrice = BigInt(log.args.totalPrice);

        const isMatch =
          fruitId === record.fruitId &&
          quantity === record.quantity &&
          totalPrice === record.totalPrice;

        logPointer++;

        if (isMatch) {
          if (historyIndex === Number(targetIndex)) {
            return log.transactionHash;
          }
          break;
        }
      }
    }

    return null;
  };

  const refreshPurchaseDetails = async () => {
    const provider = await getBrowserProvider(setStatus);
    if (!provider) return;

    if (!account) {
      setPurchase(null);
      setCurrentFruit(null);
      setStatus("Please connect your wallet.");
      return;
    }

    const isSupported = await checkSupportedNetwork(provider, setStatus);
    if (!isSupported) {
      setPurchase(null);
      setCurrentFruit(null);
      return;
    }

    try {
      setLoading(true);
      setStatus("Loading...");

      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const item = await contract.getPurchaseHistoryItem(index);

      let sellerRating = 0;
      if (isV2) {
        try {
          sellerRating = Number(await contract.getSellerRating(item[3]));
        } catch {
          sellerRating = 0;
        }
      }

      let fruitData = null;
      try {
        const fruit = await contract.getFruit(item[0]);
        fruitData = {
          id: Number(fruit[0]),
          name: fruit[1],
          price: ethers.formatEther(fruit[2]),
          stock: Number(fruit[3]),
          seller: fruit[4],
          active: fruit[5],
        };
      } catch {
        fruitData = null;
      }

      let txHash = null;
      try {
        txHash = await findPurchaseTxHash(contract, buyerAddress, index);
      } catch {
        txHash = null;
      }

      setPurchase({
        fruitId: Number(item[0]),
        fruitName: item[1],
        buyer: item[2],
        seller: item[3],
        quantity: Number(item[4]),
        unitPrice: ethers.formatEther(item[5]),
        totalPrice: ethers.formatEther(item[6]),
        timestamp: Number(item[7]),
        sellerRating,
        txHash,
      });

      setCurrentFruit(fruitData);
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Error loading purchase details.");
      setPurchase(null);
      setCurrentFruit(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account) {
      setPurchase(null);
      setCurrentFruit(null);
      return;
    }

    refreshPurchaseDetails();
  }, [account]);
  if (loading) {
    return (
      <div>
        <ToastMessage status={status} onClear={() => setStatus(null)} />
        <p>Loading purchase details...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div>
        <ToastMessage status={status} onClear={() => setStatus(null)} />
        <p>Purchase not found.</p>
      </div>
    );
  }

  return (
    <div>
      <ToastMessage status={status} onClear={() => setStatus(null)} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "6px" }}>Purchase Details</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Detailed information about this completed purchase.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            to="/purchase-history"
            className="button-secondary"
            style={{ textDecoration: "none" }}
          >
            ← Back to Purchase History
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <Card>
          <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
            Fruit
          </p>
          <h3 style={{ margin: 0, wordBreak: "break-word" }}>
            {purchase.fruitName}
          </h3>
          <p style={{ marginTop: "6px", marginBottom: 0 }}>
            Fruit ID: #{purchase.fruitId}
          </p>
        </Card>

        <Card>
          <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
            Total Paid
          </p>
          <h3 style={{ margin: 0 }}>{purchase.totalPrice} ETH</h3>
          <p style={{ marginTop: "6px", marginBottom: 0 }}>
            Unit: {purchase.unitPrice} ETH
          </p>
        </Card>

        <Card>
          <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
            Quantity
          </p>
          <h3 style={{ margin: 0 }}>{purchase.quantity}</h3>
        </Card>
      </div>

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h3 style={{ marginTop: 0 }}>Transaction Info</h3>

            <p style={{ wordBreak: "break-word" }}>
              <strong>Buyer:</strong> {shortenAddress(purchase.buyer)}
            </p>

            <p style={{ wordBreak: "break-word" }}>
              <strong>Seller:</strong> {shortenAddress(purchase.seller)}
            </p>

            <p>
              <strong>Date:</strong> {formatDate(purchase.timestamp)}
            </p>

            {purchase.txHash && (
              <>
                <p style={{ wordBreak: "break-all" }}>
                  <strong>Transaction Hash:</strong>
                  <br />
                  {purchase.txHash}
                </p>

                <a
                  href={`https://sepolia.etherscan.io/tx/${purchase.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary"
                  style={{ textDecoration: "none", display: "inline-flex" }}
                >
                  Open on Etherscan
                </a>
              </>
            )}

            {isV2 && purchase.sellerRating > 0 && (
              <p style={{ marginTop: "12px" }}>
                <strong>Seller Rating:</strong>{" "}
                <span style={{ color: "#f59e0b" }}>
                  {renderStars(purchase.sellerRating)}
                </span>{" "}
                ({purchase.sellerRating}/5)
              </p>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <h3 style={{ marginTop: 0 }}>Current Product Status</h3>

            {currentFruit ? (
              <>
                <p>
                  <strong>Status:</strong>{" "}
                  {currentFruit.active ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-danger">Deleted</span>
                  )}
                </p>

                <p>
                  <strong>Current Stock:</strong> {currentFruit.stock}
                </p>

                <p>
                  <strong>Current Price:</strong> {currentFruit.price} ETH
                </p>

                <Link
                  to={`/fruit/${purchase.fruitId}`}
                  className="button-secondary"
                  style={{ textDecoration: "none", display: "inline-flex" }}
                >
                  View Current Fruit Page
                </Link>
              </>
            ) : (
              <p style={{ marginBottom: 0, color: "var(--text-secondary)" }}>
                The current fruit data is unavailable.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
