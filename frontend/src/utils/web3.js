import { ethers } from "ethers";
import { SUPPORTED_CHAIN_ID } from "../config/contract";

export async function getBrowserProvider(setStatus) {
  if (!window.ethereum) {
    setStatus?.("MetaMask is not installed.");
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider;
}

export async function checkSupportedNetwork(provider, setStatus) {
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
    setStatus?.("Wrong network. Please switch to Sepolia.");
    return false;
  }

  return true;
}

export async function getProviderAndSigner(setStatus) {
  const provider = await getBrowserProvider(setStatus);
  if (!provider) return {};

  const isSupported = await checkSupportedNetwork(provider, setStatus);
  if (!isSupported) return { provider };

  const signer = await provider.getSigner();
  return { provider, signer };
}

export function handleWeb3Error(error, setStatus, action = "transaction") {
  console.error(error);

  if (error?.code === 4001) {
    setStatus?.("Transaction rejected.");
    return;
  }

  if (
    error?.code === "INSUFFICIENT_FUNDS" ||
    error?.message?.toLowerCase().includes("insufficient funds")
  ) {
    setStatus?.(`Insufficient funds to ${action}.`);
    return;
  }

  setStatus?.(`Error while trying to ${action}.`);
}

export async function hasEnoughGas(txRequest, signer) {
  try {
    const address = await signer.getAddress();

    const preparedTx = {
      ...txRequest,
      from: address,
    };

    const gasEstimate = await signer.provider.estimateGas(preparedTx);
    const feeData = await signer.provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;

    if (!gasPrice) return true;

    const estimatedCost = gasEstimate * gasPrice;
    const balance = await signer.provider.getBalance(address);

    return balance >= estimatedCost;
  } catch (error) {
    console.error("Gas check error:", error);
    return true;
  }
}

const SEPOLIA_CHAIN_HEX = "0xaa36a7";

export async function switchToSepolia(setStatus) {
  if (!window.ethereum) {
    setStatus?.("MetaMask is not installed.");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });

    setStatus?.("Switched to Sepolia.");
    return true;
  } catch (error) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_HEX,
              chainName: "Sepolia",
              nativeCurrency: {
                name: "Sepolia Ether",
                symbol: "SEP",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_HEX }],
        });

        setStatus?.("Sepolia added and selected.");
        return true;
      } catch (addError) {
        setStatus?.("User rejected network addition.");
        return false;
      }
    }

    if (error.code === 4001) {
      setStatus?.("User rejected network switch.");
      return false;
    }

    setStatus?.("Error switching network.");
    return false;
  }
}

export async function getCurrentChainId() {
  if (!window.ethereum) return null;

  return await window.ethereum.request({
    method: "eth_chainId",
  });
}
