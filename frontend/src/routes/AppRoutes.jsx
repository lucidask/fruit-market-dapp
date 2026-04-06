import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

import Marketplace from "../pages/Marketplace";
import MyStore from "../pages/store/MyStore";

import { CONTRACT_ADDRESS } from "../config/contract";
import abi from "../config/abi.json";
import BuyerDashboard from "../pages/purchase/BuyerDashboard";
import PurchaseHistory from "../pages/history/PurchaseHistory";
import SalesHistory from "../pages/history/SalesHistory";
import FruitDetails from "../pages/FruitDetails";

export default function AppRoutes() {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("");
  const [isV2, setIsV2] = useState(false);

  // 🔍 Détection version contrat
  useEffect(() => {
    const checkVersion = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        try {
          await contract.getSellerRating("0x0000000000000000000000000000000000000000");
          setIsV2(true);
        } catch {
          setIsV2(false);
        }
      } catch (err) {
        console.error(err);
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
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
                    />
                  }
                />
                
              </Routes>
            </div>
          </main>
        </div>
  </BrowserRouter>
);
}