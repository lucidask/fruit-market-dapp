// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FruitMarketV1.sol";

// Extension upgradeable de V1 : ajoute la notation des vendeurs sans modifier le stockage existant de V1.
contract FruitMarketV2 is FruitMarketV1 {
    // Somme cumulative des notes par vendeur ; l'indice moyen est calcule a la lecture.
    mapping(address => uint256) private sellerRatingSum;
    // Nombre total de notes recues par vendeur.
    mapping(address => uint256) private sellerRatingCount;
    // Empeche un meme acheteur de noter plusieurs fois le meme vendeur.
    mapping(address => mapping(address => bool)) private hasRatedSeller;

    event SellerRated(
        address indexed seller,
        address indexed buyer,
        uint256 rating
    );

    /// @notice Permet a un acheteur de noter un vendeur apres au moins un achat.
    /// @dev Utilise hasBoughtFromSeller herite de V1 comme preuve d'achat minimale.
    /// @param seller Adresse du vendeur note.
    /// @param rating Note comprise entre 1 et 5.
    function rateSeller(address seller, uint256 rating) external {
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Cannot rate yourself");
        require(rating >= 1 && rating <= 5, "Rating must be 1 to 5");
        require(
            hasBoughtFromSeller[msg.sender][seller],
            "Must buy before rating"
        );
        require(
            !hasRatedSeller[msg.sender][seller],
            "Seller already rated"
        );

        // L'etat est marque avant l'agregation pour verrouiller definitivement une seule note buyer -> seller.
        hasRatedSeller[msg.sender][seller] = true;
        sellerRatingSum[seller] += rating;
        sellerRatingCount[seller] += 1;

        emit SellerRated(seller, msg.sender, rating);
    }

    /// @notice Retourne la note moyenne entiere d'un vendeur.
    /// @param seller Adresse du vendeur consulte.
    /// @return Moyenne arrondie a l'entier inferieur, ou 0 si aucune note n'existe.
    function getSellerRating(address seller) external view returns (uint256) {
        if (sellerRatingCount[seller] == 0) {
            return 0;
        }

        return sellerRatingSum[seller] / sellerRatingCount[seller];
    }

    /// @notice Indique si un acheteur a deja note un vendeur.
    /// @param buyer Adresse de l'acheteur.
    /// @param seller Adresse du vendeur.
    /// @return true si la note buyer -> seller a deja ete enregistree.
    function hasRated(address buyer, address seller)
        external
        view
        returns (bool)
    {
        return hasRatedSeller[buyer][seller];
    }

    /// @notice Retourne le nombre de notes recues par un vendeur.
    /// @param seller Adresse du vendeur.
    /// @return Nombre total de notes enregistrees.
    function getSellerRatingCount(address seller)
        external
        view
        returns (uint256)
    {
        return sellerRatingCount[seller];
    }

    /// @notice Retourne la somme brute des notes recues par un vendeur.
    /// @param seller Adresse du vendeur.
    /// @return Somme cumulative des notes, utile pour recalculer ou auditer la moyenne.
    function getSellerRatingSum(address seller)
        external
        view
        returns (uint256)
    {
        return sellerRatingSum[seller];
    }
}