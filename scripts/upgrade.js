const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Fonction principale
async function main() {
  // Adresse du proxy déjà déployé en V1
  const proxyAddress = "0x20c56dD7f741254f1FFFB7BF0F9F2cFa650ad52F";

  console.log("Upgrade du proxy :", proxyAddress);

  // Charge le contrat V2
  const FruitMarketV2 = await ethers.getContractFactory("FruitMarketV2");

  // Upgrade du proxy vers V2
  const upgraded = await upgrades.upgradeProxy(proxyAddress, FruitMarketV2);

  // Attend la fin de l'upgrade
  await upgraded.deployed();

  console.log("✅ Upgrade terminé !");
  console.log("Adresse du proxy (inchangée) :", upgraded.address);

  // Met à jour automatiquement l’ABI du front
  await updateFrontendAbi();

  console.log("\n🔗 Voir sur Etherscan :");
  console.log(`https://sepolia.etherscan.io/address/${upgraded.address}`);
  console.log("✅ ABI du front mise à jour.");
}

// Copie l'ABI V2 dans le front
async function updateFrontendAbi() {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "FruitMarketV2.sol",
    "FruitMarketV2.json"
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
}

// Gestion des erreurs
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});