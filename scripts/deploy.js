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
    initializer: "initialize",
    kind: "uups",
  });

  // Attend que le déploiement soit terminé
  await fruitMarket.deployed();

  // Récupère l'adresse du proxy
  const proxyAddress = fruitMarket.address;

  console.log("✅ Proxy déployé à :", proxyAddress);

  // Sauvegarde l’adresse du proxy
  await saveDeployment(proxyAddress);

  // Met à jour automatiquement l’adresse dans le front-end
  await updateFrontendContractAddress(proxyAddress);

  // Met à jour automatiquement l’ABI V1 dans le front-end
  await updateFrontendAbi();

  console.log("\n🔗 Liens utiles :");
  console.log(`📄 Contrat : https://sepolia.etherscan.io/address/${proxyAddress}`);
  console.log("📡 Réseau : Sepolia");
}

// Sauvegarde l’adresse du proxy dans deployments/<network>.json
async function saveDeployment(proxyAddress) {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name || "unknown";

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);

  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(
      {
        proxy: proxyAddress,
      },
      null,
      2
    )
  );

  console.log(`📁 Déploiement sauvegardé : ${deploymentPath}`);
}

// Met à jour l’adresse du contrat dans le front
async function updateFrontendContractAddress(address) {
  const contractConfigPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config",
    "contract.js"
  );

  const content = `export const CONTRACT_ADDRESS = "${address}";
export const SUPPORTED_CHAIN_ID = 11155111;
export const NETWORK_NAME = "Sepolia";
`;

  fs.writeFileSync(contractConfigPath, content);
}

// Met à jour l’ABI dans le front
async function updateFrontendAbi() {
  // Chemin vers l’ABI générée par Hardhat (V1)
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "FruitMarketV1.sol",
    "FruitMarketV1.json"
  );

  const frontendAbiPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config",
    "abi.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  fs.writeFileSync(frontendAbiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("✅ ABI V1 du front mise à jour.");
}

// Gestion des erreurs
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});