// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FruitMarketV1.sol";

contract FruitMarketV2 is FruitMarketV1 {
    mapping(address => uint256) private sellerRatingSum;
    mapping(address => uint256) private sellerRatingCount;
    mapping(address => mapping(address => bool)) private hasRatedSeller;

    event SellerRated(
        address indexed seller,
        address indexed buyer,
        uint256 rating
    );

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

        hasRatedSeller[msg.sender][seller] = true;
        sellerRatingSum[seller] += rating;
        sellerRatingCount[seller] += 1;

        emit SellerRated(seller, msg.sender, rating);
    }

    function getSellerRating(address seller) external view returns (uint256) {
        if (sellerRatingCount[seller] == 0) {
            return 0;
        }

        return sellerRatingSum[seller] / sellerRatingCount[seller];
    }

    function hasRated(address buyer, address seller)
        external
        view
        returns (bool)
    {
        return hasRatedSeller[buyer][seller];
    }

    function getSellerRatingCount(address seller)
        external
        view
        returns (uint256)
    {
        return sellerRatingCount[seller];
    }

    function getSellerRatingSum(address seller)
        external
        view
        returns (uint256)
    {
        return sellerRatingSum[seller];
    }
}