import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

import Marketplace from "../pages/Marketplace";
import MyStore from "../pages/store/MyStore";
import BuyerDashboard from "../pages/purchase/BuyerDashboard";
import PurchaseHistory from "../pages/history/PurchaseHistory";
import SalesHistory from "../pages/history/SalesHistory";
import FruitDetails from "../pages/FruitDetails";
import PurchaseDetails from "../pages/history/PurchaseDetails";
import SalesDetails from "../pages/history/SalesDetails";
import PurchaseSuccess from "../pages/purchase/PurchaseSuccess";

import { CONTRACT_ADDRESS } from "../config/contract";
import abi from "../config/abi.json";

export default function AppRoutes() {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("");
  const [isV2, setIsV2] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      if (!window.ethereum) {
        setIsV2(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const hasGetSellerRating = abi.some(
          (item) => item.type === "function" && item.name === "getSellerRating"
        );

        if (!hasGetSellerRating) {
          setIsV2(false);
          return;
        }

        await contract.getSellerRating("0x0000000000000000000000000000000000000000");
        setIsV2(true);
      } catch (err) {
        console.error("Erreur détection V2 :", err);
        setIsV2(false);
      }
    };

    checkVersion();
  }, []);

  return (
    <BrowserRouter>
      <Navbar
        account={account}
        setAccount={setAccount}
        setStatus={setStatus}
      />

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar isV2={isV2} />

        <main style={{ flex: 1, padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              padding: "0 20px",
            }}
          >
            <div
              style={{
                width: "fit-content",
                minWidth: "60%",
                maxWidth: "1400px",
              }}
            >
            <Routes>
              <Route
                path="/"
                element={
                  <Marketplace
                    account={account}
                    setAccount={setAccount}
                    status={status}
                    setStatus={setStatus}
                    isV2={isV2}
                  />
                }
              />

              <Route
                path="/buyer-dashboard"
                element={
                  <BuyerDashboard
                    account={account}
                    setAccount={setAccount}
                    status={status}
                    setStatus={setStatus}
                    isV2={isV2}
                  />
                }
              />

              <Route
                path="/seller"
                element={
                  <MyStore
                    account={account}
                    setAccount={setAccount}
                    status={status}
                    setStatus={setStatus}
                    isV2={isV2}
                  />
                }
              />

              <Route
                path="/purchase-history"
                element={
                  <PurchaseHistory
                    account={account}
                    status={status}
                    setStatus={setStatus}
                  />
                }
              />

              <Route
                path="/sales-history"
                element={
                  <SalesHistory
                    account={account}
                    status={status}
                    setStatus={setStatus}
                  />
                }
              />

              <Route
                path="/fruit/:id"
                element={
                  <FruitDetails
                    account={account}
                    status={status}
                    setStatus={setStatus}
                    isV2={isV2}
                  />
                }
              />

              <Route
                path="/purchase-details/:index"
                element={
                  <PurchaseDetails
                    account={account}
                    status={status}
                    setStatus={setStatus}
                    isV2={isV2}
                  />
                }
              />

              <Route
                path="/sales-details/:index"
                element={
                  <SalesDetails
                    account={account}
                    status={status}
                    setStatus={setStatus}
                    isV2={isV2}
                  />
                }
              />

              <Route
                path="/purchase-success"
                element={
                  <PurchaseSuccess
                    account={account}
                    status={status}
                    setStatus={setStatus}
                    isV2={isV2}
                  />
                }
              />
            </Routes>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}