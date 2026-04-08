import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ethers } from "ethers";

import ToastMessage from "../../components/common/ToastMessage";
import Card from "../../components/common/Card";
import abi from "../../config/abi.json";
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";
import { shortenAddress } from "../../utils/format";

export default function SalesDetails({ account, status, setStatus }) {
  const { index } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const findSaleTxHash = async (contract, targetIndex) => {
    const count = Number(await contract.getSalesHistoryCount());

    const salesItems = [];
    for (let i = 0; i < count; i++) {
      const item = await contract.getSalesHistoryItem(i);
      salesItems.push({
        fruitId: BigInt(item[0]),
        buyer: item[2].toLowerCase(),
        quantity: BigInt(item[4]),
        totalPrice: BigInt(item[6]),
      });
    }

    const logs = await contract.queryFilter(contract.filters.FruitPurchased());

    const sortedLogs = [...logs].sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      return a.index - b.index;
    });

    let logPointer = 0;

    for (let salesIndex = 0; salesIndex < salesItems.length; salesIndex++) {
      const record = salesItems[salesIndex];

      while (logPointer < sortedLogs.length) {
        const log = sortedLogs[logPointer];
        const fruitId = BigInt(log.args.fruitId);
        const buyer = log.args.buyer.toLowerCase();
        const quantity = BigInt(log.args.quantity);
        const totalPrice = BigInt(log.args.totalPrice);

        const isMatch =
          fruitId === record.fruitId &&
          buyer === record.buyer &&
          quantity === record.quantity &&
          totalPrice === record.totalPrice;

        logPointer++;

        if (isMatch) {
          if (salesIndex === Number(targetIndex)) {
            return log.transactionHash;
          }
          break;
        }
      }
    }

    return null;
  };

  const refreshSaleDetails = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
      return;
    }

    if (!account) {
      setStatus("Please connect your wallet.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
        setStatus("Wrong network. Please switch to Sepolia.");
        return;
      }

      setLoading(true);
      setStatus("Loading...");

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const item = await contract.getSalesHistoryItem(index);

      let txHash = null;
      try {
        txHash = await findSaleTxHash(contract, index);
      } catch {
        txHash = null;
      }

      setSale({
        fruitId: Number(item[0]),
        fruitName: item[1],
        buyer: item[2],
        seller: item[3],
        quantity: Number(item[4]),
        unitPrice: ethers.formatEther(item[5]),
        totalPrice: ethers.formatEther(item[6]),
        timestamp: Number(item[7]),
        txHash,
      });

      setStatus("Sale details loaded.");
    } catch (error) {
      console.error(error);
      setStatus("Error loading sale details.");
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      refreshSaleDetails();
    }
  }, [account, index]);

  if (loading) {
    return (
      <div>
        <ToastMessage status={status} onClear={() => setStatus(null)} />
        <p>Loading sale details...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div>
        <ToastMessage status={status} onClear={() => setStatus(null)} />
        <p>Sale not found.</p>
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
          <h1 style={{ marginBottom: "6px" }}>Sale Details</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Detailed information about this completed sale.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            to="/sales-history"
            className="button-secondary"
            style={{ textDecoration: "none" }}
          >
            ← Back to Sales History
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
          <p style={{ color: "var(--text-secondary)" }}>Fruit</p>
          <h3 style={{ margin: 0, wordBreak: "break-word" }}>{sale.fruitName}</h3>
          <p style={{ marginTop: "6px", marginBottom: 0 }}>
            Fruit ID: #{sale.fruitId}
          </p>
        </Card>

        <Card>
          <p style={{ color: "var(--text-secondary)" }}>Total Received</p>
          <h3 style={{ margin: 0 }}>{sale.totalPrice} ETH</h3>
          <p style={{ marginTop: "6px", marginBottom: 0 }}>
            Unit: {sale.unitPrice} ETH
          </p>
        </Card>

        <Card>
          <p style={{ color: "var(--text-secondary)" }}>Quantity</p>
          <h3 style={{ margin: 0 }}>{sale.quantity}</h3>
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
              <strong>Buyer:</strong> {shortenAddress(sale.buyer)}
            </p>

            <p style={{ wordBreak: "break-word" }}>
              <strong>Seller:</strong> {shortenAddress(sale.seller)}
            </p>

            <p>
              <strong>Date:</strong> {formatDate(sale.timestamp)}
            </p>

            {sale.txHash && (
              <>
                <p style={{ wordBreak: "break-all" }}>
                  <strong>Transaction Hash:</strong><br />
                  {sale.txHash}
                </p>

                <a
                  href={`https://sepolia.etherscan.io/tx/${sale.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary"
                  style={{ textDecoration: "none", display: "inline-flex" }}
                >
                  Open on Etherscan
                </a>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}