const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Fonction principale de déploiement
async function main() {

  // Récupère le compte qui va déployer le contrat
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte :", deployer.address);

  // Charge le contrat V1
  const FruitMarketV1 = await ethers.getContractFactory("FruitMarketV1");

  console.log("Déploiement du proxy (V1)...");

  // Déploie le contrat avec un proxy UUPS
  const fruitMarket = await upgrades.deployProxy(FruitMarketV1, [], {
    initializer: "initialize", // fonction appelée après déploiement
    kind: "uups", // type de proxy
  });

  // Attend que le déploiement soit terminé
  await fruitMarket.deployed();

  // Récupère l'adresse du proxy
  const proxyAddress = fruitMarket.address;

  console.log("✅ Proxy déployé à :", proxyAddress);

  // Met à jour automatiquement l’adresse dans le front-end
  await updateFrontendContractAddress(proxyAddress);

  // Met à jour automatiquement l’ABI dans le front-end
  await updateFrontendAbi();

  console.log("\n🔗 Liens utiles :");
  console.log(`📄 Contrat : https://sepolia.etherscan.io/address/${proxyAddress}`);
  console.log("📡 Réseau : Sepolia");
}

// Met à jour l’adresse du contrat dans le front
async function updateFrontendContractAddress(address) {

  // Chemin vers le fichier config du front
  const contractConfigPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config",
    "contract.js"
  );

  // Contenu à écrire dans le fichier
  const content = `export const CONTRACT_ADDRESS = "${address}";
export const SUPPORTED_CHAIN_ID = 11155111;
export const NETWORK_NAME = "Sepolia";
`;

  // Écrit le nouveau fichier
  fs.writeFileSync(contractConfigPath, content);
}

// Met à jour l’ABI dans le front
async function updateFrontendAbi() {

  // Chemin vers l’ABI générée par Hardhat (V2)
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "FruitMarketV2.sol",
    "FruitMarketV2.json"
  );

  // Chemin du fichier ABI dans le front
  const frontendAbiPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config",
    "abi.json"
  );

  // Lit l’ABI depuis Hardhat
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Copie l’ABI dans le front
  fs.writeFileSync(frontendAbiPath, JSON.stringify(artifact.abi, null, 2));
}

// Gestion des erreurs
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});