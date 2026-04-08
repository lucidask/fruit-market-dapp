import { Link, useLocation } from "react-router-dom";
import ToastMessage from "../../components/common/ToastMessage";
import Card from "../../components/common/Card";
import { shortenAddress } from "../../utils/format";

export default function PurchaseSuccess({ account, status, setStatus }) {
  const location = useLocation();
  const purchase = location.state;

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  if (!purchase) {
    return (
      <div>
        <ToastMessage status={status} onClear={() => setStatus(null)} />
        <h1>Purchase Success</h1>
        <p>No purchase data available.</p>

        <Link
          to="/"
          className="button-secondary"
          style={{ textDecoration: "none" }}
        >
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const {
    fruitId,
    fruitName,
    quantity,
    unitPrice,
    totalPrice,
    seller,
    buyer,
    txHash,
    purchasedAt,
  } = purchase;

  return (
    <div>
      <ToastMessage status={status} onClear={() => setStatus(null)} />

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <h1 style={{ marginBottom: "6px" }}>Purchase Successful</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Your order has been confirmed on the blockchain.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <Card>
          <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
            Fruit
          </p>
          <h3 style={{ margin: 0 }}>{fruitName}</h3>
          <p style={{ marginTop: "6px", marginBottom: 0 }}>
            Fruit ID: #{fruitId}
          </p>
        </Card>

        <Card>
          <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
            Quantity
          </p>
          <h3 style={{ margin: 0 }}>{quantity}</h3>
        </Card>

        <Card>
          <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
            Total Paid
          </p>
          <h3 style={{ margin: 0 }}>{totalPrice} ETH</h3>
          <p style={{ marginTop: "6px", marginBottom: 0 }}>
            Unit: {unitPrice} ETH
          </p>
        </Card>
      </div>

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
          }}
        >
          <div>
            <h3 style={{ marginTop: 0 }}>Transaction Details</h3>

            <p>
              <strong>Buyer:</strong> {buyer ? shortenAddress(buyer) : "-"}
            </p>

            <p>
              <strong>Seller:</strong> {seller ? shortenAddress(seller) : "-"}
            </p>

            <p>
              <strong>Date:</strong> {formatDate(purchasedAt)}
            </p>

            <p style={{ wordBreak: "break-all" }}>
              <strong>Transaction Hash:</strong><br />
              {txHash || "-"}
            </p>
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>Next Actions</h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <Link
                to="/buyer-dashboard"
                className="button-secondary"
                style={{ textDecoration: "none" }}
              >
                Go to Buyer Dashboard
              </Link>

              <Link
                to="/purchase-history"
                className="button-secondary"
                style={{ textDecoration: "none" }}
              >
                View Purchase History
              </Link>

              <Link
                to={`/fruit/${fruitId}`}
                className="button-secondary"
                style={{ textDecoration: "none" }}
              >
                View Fruit Details
              </Link>

              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary"
                  style={{ textDecoration: "none" }}
                >
                  Open on Etherscan
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}