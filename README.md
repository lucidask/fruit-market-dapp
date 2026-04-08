# 🍎 Fruit Market DApp

Fruit Market est une DApp de marketplace de fruits sur Ethereum Sepolia. Le projet combine un smart contract upgradeable UUPS, un front-end React/Vite avec MetaMask, et une interface séparée pour le catalogue, le tableau de bord acheteur, la boutique vendeur, l’historique d’achats et l’historique de ventes.

## Fonctionnalités implémentées

### Smart contracts

**FruitMarketV1**
- ajout d’un fruit avec `addFruit(name, price, stock)`
- achat d’un fruit avec paiement exact en ETH via `buyFruit(fruitId, quantity)`
- mise à jour d’un fruit par son vendeur avec `updateFruit(fruitId, price, stock)`
- suppression logique d’un fruit via `removeFruit(fruitId)`
- lecture d’un fruit avec `getFruit(fruitId)`
- suivi agrégé des achats par acheteur et par fruit avec `getPurchaseQuantity(fruitId, buyer)`
- historique complet des achats côté acheteur
- historique complet des ventes côté vendeur
- protection `Ownable`, `UUPSUpgradeable`, `ReentrancyGuardUpgradeable`

**FruitMarketV2**
- héritage de V1
- notation des vendeurs après achat
- vérification qu’un acheteur a bien acheté chez un vendeur avant de le noter
- moyenne des notes avec `getSellerRating(seller)`
- prévention du double vote avec `hasRated(buyer, seller)`

### Front-end
- connexion MetaMask
- catalogue Marketplace
- tableau de bord acheteur avec achats agrégés
- historique d’achats transaction par transaction
- historique de ventes transaction par transaction
- détails d’un achat (PurchaseDetails)
- détails d’une vente (SalesDetails)
- page de confirmation d’achat (PurchaseSuccess)
- tableau de bord vendeur “My Store”
- ajout, modification et suppression logique de fruits
- achat avec quantité et paiement ETH
- notation du vendeur après achat
- page de détail d’un fruit
- navigation intelligente entre les vues
- toasts de statut et gestion des erreurs de transaction

## Stack technique
- Solidity `^0.8.24`
- Hardhat
- OpenZeppelin Upgrades (UUPS)
- React + Vite
- ethers.js
- MetaMask
- Sepolia testnet

## Structure logique du projet

```text
fruit-market-dapp/
│
├── contracts/ # Smart contracts (V1, V2)
├── scripts/ # Déploiement et upgrade
├── test/ # Tests Hardhat
├── frontend/ # Application React
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ ├── config/
│ │ └── utils/
│
├── hardhat.config.js
└── README.md
```

## 🧠 Architecture de l’application

L’application est structurée en 3 couches principales :

- **Smart Contract (Blockchain)**  
  Gère la logique métier, les transactions, les historiques et les règles de sécurité.

- **Backend Hardhat (scripts/tests)**  
  Permet le déploiement, les upgrades et la validation du contrat.

- **Frontend React**  
  Interface utilisateur permettant d’interagir avec le smart contract via ethers.js et MetaMask.

La communication se fait directement entre le frontend et le smart contract via le provider Ethereum.

## Prérequis
- Node.js 18.x ou 20.x recommandé
- npm
- MetaMask
- un compte Sepolia avec un peu d’ETH de test
- un fichier `.env` à la racine

## Configuration

Créer `.env` à la racine :

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY
```

Ne jamais versionner ce fichier.

## Installation

### Backend / Hardhat
```bash
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Compilation
```bash
npx hardhat compile
```

## Tests
```bash
npx hardhat test
```

Les tests couvrent notamment :
- l’initialisation du proxy
- l’ajout, l’achat, la mise à jour et la suppression logique d’un fruit
- les historiques d’achats et de ventes de V1
- la conservation des données après upgrade V1 → V2
- la notation des vendeurs dans V2
- les cas d’erreur importants

## Déploiement V1 sur Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Le script de déploiement :
- déploie un proxy UUPS sur Sepolia
- affiche l’adresse du proxy
- met à jour automatiquement `frontend/src/config/contract.js`
- copie l’ABI dans `frontend/src/config/abi.json`

## Upgrade V1 → V2
```bash
npx hardhat run scripts/upgrade.js --network sepolia
```

Le script d’upgrade :
- upgrade le proxy existant vers `FruitMarketV2`
- conserve la même adresse proxy
- met à jour l’ABI du front

## Lancer le frontend
```bash
cd frontend
npm run dev
```

Puis ouvrir l’adresse Vite affichée dans le terminal, généralement :

```text
http://localhost:5173
```

## Scénario de démonstration
1. connecter MetaMask sur Sepolia
2. ajouter un fruit avec un compte vendeur
3. vérifier son apparition dans Marketplace et My Store
4. acheter ce fruit avec un second compte
5. vérifier :
   - l’agrégat dans Buyer Dashboard
   - une ligne dans Purchase History
   - une ligne dans Sales History
6. faire un second achat du même fruit
7. vérifier :
   - agrégation dans Buyer Dashboard
   - plusieurs lignes distinctes dans les historiques
8. upgrader le proxy vers V2
9. noter le vendeur après achat
10. vérifier que les données existantes ont été conservées

## Rôles et règles métier
- le vendeur est l’adresse `msg.sender` qui ajoute le fruit
- seul le vendeur du fruit peut le modifier ou le supprimer
- un achat exige un paiement exact `price * quantity`
- un fruit supprimé devient inactif, il n’est pas effacé du stockage
- l’historique des achats est stocké côté acheteur
- l’historique des ventes est stocké côté vendeur
- un vendeur ne peut pas se noter lui-même
- un acheteur doit avoir déjà acheté chez le vendeur avant de le noter
- un acheteur ne peut noter un vendeur qu’une seule fois

## Sécurité
- `OwnableUpgradeable`
- `UUPSUpgradeable`
- `ReentrancyGuardUpgradeable`
- validations `require` sur les entrées
- séparation logique/stockage via proxy upgradeable
- gestion des erreurs côté front pour MetaMask, réseau et transactions refusées

## 🔗 Déploiement

- Réseau : Sepolia
- Adresse du proxy : [À remplir]
- Lien Etherscan : https://sepolia.etherscan.io/address/[ADRESSE]

⚠️ Toujours utiliser l’adresse du proxy pour interagir avec le contrat.

## Remarques de fonctionnement
- l’adresse utilisée côté front doit toujours être l’adresse du proxy, pas l’adresse de l’implémentation
- après chaque déploiement ou upgrade, vérifier que `contract.js` et `abi.json` du front ont bien été mis à jour
- l’interface détecte la disponibilité des fonctions V2 côté front pour adapter l’affichage des notes

## Commandes utiles
```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/upgrade.js --network sepolia
```

## ⚠️ Limitations

- pas de panier multi-produits
- pas de pagination des historiques
- pas de backend off-chain (tout on-chain)

Ces choix sont volontaires pour rester aligné avec les exigences du TP.