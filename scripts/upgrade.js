const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Fonction principale
async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name || "unknown";

  const deploymentPath = path.join(
    __dirname,
    "..",
    "deployments",
    `${networkName}.json`
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Fichier de déploiement introuvable : ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const proxyAddress = deployment.proxy;

  if (!proxyAddress) {
    throw new Error("Adresse proxy manquante dans le fichier de déploiement.");
  }

  console.log("Upgrade du proxy :", proxyAddress);

  // Charge le contrat V2
  const FruitMarketV2 = await ethers.getContractFactory("FruitMarketV2");

  // Upgrade du proxy vers V2
  const upgraded = await upgrades.upgradeProxy(proxyAddress, FruitMarketV2);

  // Attend la fin de l'upgrade
  await upgraded.deployed();

  console.log("✅ Upgrade terminé !");
  console.log("Adresse du proxy (inchangée) :", upgraded.address);

  // Sauvegarde l'adresse du proxy après upgrade
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(
      {
        ...deployment,
        proxy: upgraded.address
      },
      null,
      2
    )
  );

  // Met à jour automatiquement l’ABI du front
  await updateFrontendAbi();

  console.log("\n🔗 Voir sur Etherscan :");
  console.log(`https://sepolia.etherscan.io/address/${upgraded.address}`);
  console.log("✅ ABI V2 du front mise à jour.");
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