// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Imports OpenZeppelin pour contrat upgradeable (UUPS)
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// Contrat principal du marché de fruits (version V1)
contract FruitMarketV1 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Structure d’un fruit
    struct Fruit {
        uint256 id;        // identifiant unique
        string name;       // nom du fruit
        uint256 price;     // prix unitaire
        uint256 stock;     // quantité disponible
        address seller;    // vendeur
        bool active;       // actif ou supprimé
    }

    // Structure d’un enregistrement d’achat/vente
    struct PurchaseRecord {
        uint256 fruitId;       // id du fruit acheté
        string fruitName;      // nom du fruit au moment de l’achat
        address buyer;         // acheteur
        address seller;        // vendeur
        uint256 quantity;      // quantité achetée
        uint256 unitPrice;     // prix unitaire au moment de l’achat
        uint256 totalPrice;    // montant total payé
        uint256 timestamp;     // date de l’achat
    }

    uint256 public fruitCount;
    // compteur total de fruits → utilisé pour créer des IDs uniques

    mapping(uint256 => Fruit) internal fruits;
    // mapping pour stocker tous les fruits par id

    mapping(uint256 => mapping(address => uint256)) internal purchases;
    // stocke combien chaque utilisateur a acheté pour chaque fruit

    mapping(address => PurchaseRecord[]) internal purchaseHistory;
    // historique complet des achats par acheteur

    mapping(address => PurchaseRecord[]) internal salesHistory;
    // historique complet des ventes par vendeur

    // ===== EVENTS =====

    // événement quand un fruit est ajouté
    event FruitAdded(
        uint256 indexed fruitId,
        string name,
        uint256 price,
        uint256 stock,
        address indexed seller
    );

    // événement quand un fruit est acheté
    event FruitPurchased(
        uint256 indexed fruitId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice
    );

    // événement quand un fruit est modifié
    event FruitUpdated(
        uint256 indexed fruitId,
        uint256 newPrice,
        uint256 newStock
    );

    // événement quand un fruit est supprimé
    event FruitRemoved(uint256 indexed fruitId);

    // ===== INITIALIZATION =====

    // remplace le constructeur (obligatoire pour upgradeable)
    function initialize() public initializer {
        __Ownable_init(); // définit le propriétaire
        __UUPSUpgradeable_init();   // initialise UUPS
        __ReentrancyGuard_init();   // protection contre reentrancy
    }

    // ===== FONCTIONS PRINCIPALES =====

    // ajouter un fruit au marché
    function addFruit(
        string memory name,
        uint256 price,
        uint256 stock
    ) external {
        // vérifications pour éviter données invalides
        require(bytes(name).length > 0, "Name required");
        require(price > 0, "Price must be > 0");
        require(stock > 0, "Stock must be > 0");

        fruitCount++; // on incrémente pour créer un nouvel ID

        // création du fruit dans le mapping
        fruits[fruitCount] = Fruit({
            id: fruitCount,
            name: name,
            price: price,
            stock: stock,
            seller: msg.sender, // celui qui ajoute devient vendeur
            active: true
        });

        emit FruitAdded(fruitCount, name, price, stock, msg.sender);
    }

    // acheter un fruit
    function buyFruit(uint256 fruitId, uint256 quantity)
        external
        payable
        nonReentrant
    {
        require(fruitId > 0 && fruitId <= fruitCount, "Invalid fruit id");
        require(quantity > 0, "Quantity must be > 0");

        Fruit storage fruit = fruits[fruitId];

        require(fruit.active, "Fruit inactive");
        require(fruit.stock >= quantity, "Not enough stock");

        uint256 totalPrice = fruit.price * quantity;

        require(msg.value == totalPrice, "Incorrect payment");

        // mise à jour du stock
        fruit.stock -= quantity;

        // enregistrement existant (NE PAS SUPPRIMER)
        purchases[fruitId][msg.sender] += quantity;

        // ===== NOUVEAU : création du record =====
        PurchaseRecord memory record = PurchaseRecord({
            fruitId: fruitId,
            fruitName: fruit.name,
            buyer: msg.sender,
            seller: fruit.seller,
            quantity: quantity,
            unitPrice: fruit.price,
            totalPrice: totalPrice,
            timestamp: block.timestamp
        });

        // historique acheteur
        purchaseHistory[msg.sender].push(record);

        // historique vendeur
        salesHistory[fruit.seller].push(record);

        // transfert de l'argent
        payable(fruit.seller).transfer(totalPrice);

        emit FruitPurchased(fruitId, msg.sender, quantity, totalPrice);
    }

    // modifier un fruit (prix + stock)
    function updateFruit(
        uint256 fruitId,
        uint256 price,
        uint256 stock
    ) external {
        require(fruitId > 0 && fruitId <= fruitCount, "Invalid fruit id");
        require(price > 0, "Price must be > 0");
        require(stock > 0, "Stock must be > 0");

        Fruit storage fruit = fruits[fruitId];

        // seul le vendeur peut modifier
        require(fruit.seller == msg.sender, "Not seller");
        require(fruit.active, "Fruit inactive");

        fruit.price = price;
        fruit.stock = stock;

        emit FruitUpdated(fruitId, price, stock);
    }

    // supprimer un fruit (on le désactive seulement)
    function removeFruit(uint256 fruitId) external {
        require(fruitId > 0 && fruitId <= fruitCount, "Invalid fruit id");

        Fruit storage fruit = fruits[fruitId];

        require(fruit.seller == msg.sender, "Not seller");
        require(fruit.active, "Fruit already inactive");

        fruit.active = false; // on ne supprime pas, on désactive

        emit FruitRemoved(fruitId);
    }

    // ===== FONCTIONS DE LECTURE =====

    // récupérer les infos d’un fruit
    function getFruit(uint256 fruitId)
        external
        view
        returns (
            uint256 id,
            string memory name,
            uint256 price,
            uint256 stock,
            address seller,
            bool active
        )
    {
        require(fruitId > 0 && fruitId <= fruitCount, "Invalid fruit id");

        Fruit memory fruit = fruits[fruitId];

        return (
            fruit.id,
            fruit.name,
            fruit.price,
            fruit.stock,
            fruit.seller,
            fruit.active
        );
    }

    // retourne le nombre total de fruits
    function getFruitCount() external view returns (uint256) {
        return fruitCount;
    }

    // retourne combien un utilisateur a acheté d’un fruit
    function getPurchaseQuantity(uint256 fruitId, address buyer)
        external
        view
        returns (uint256)
    {
        require(fruitId > 0 && fruitId <= fruitCount, "Invalid fruit id");

        return purchases[fruitId][buyer];
    }

        // retourne le nombre total d'achats de l'utilisateur connecté
    function getPurchaseHistoryCount() external view returns (uint256) {
        return purchaseHistory[msg.sender].length;
    }

    // retourne le nombre total de ventes du vendeur connecté
    function getSalesHistoryCount() external view returns (uint256) {
        return salesHistory[msg.sender].length;
    }

    // retourne un achat précis de l'utilisateur connecté
    function getPurchaseHistoryItem(uint256 index)
        external
        view
        returns (
            uint256 fruitId,
            string memory fruitName,
            address buyer,
            address seller,
            uint256 quantity,
            uint256 unitPrice,
            uint256 totalPrice,
            uint256 timestamp
        )
    {
        require(index < purchaseHistory[msg.sender].length, "Invalid history index");

        PurchaseRecord memory record = purchaseHistory[msg.sender][index];

        return (
            record.fruitId,
            record.fruitName,
            record.buyer,
            record.seller,
            record.quantity,
            record.unitPrice,
            record.totalPrice,
            record.timestamp
        );
    }

    // retourne une vente précise du vendeur connecté
    function getSalesHistoryItem(uint256 index)
        external
        view
        returns (
            uint256 fruitId,
            string memory fruitName,
            address buyer,
            address seller,
            uint256 quantity,
            uint256 unitPrice,
            uint256 totalPrice,
            uint256 timestamp
        )
    {
        require(index < salesHistory[msg.sender].length, "Invalid history index");

        PurchaseRecord memory record = salesHistory[msg.sender][index];

        return (
            record.fruitId,
            record.fruitName,
            record.buyer,
            record.seller,
            record.quantity,
            record.unitPrice,
            record.totalPrice,
            record.timestamp
        );
    }

    // ===== UPGRADE =====

    // autorise l’upgrade seulement au owner
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}