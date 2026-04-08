const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FruitMarketV2", function () {
  let proxy, owner, buyer;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();

    const V1 = await ethers.getContractFactory("FruitMarketV1");
   proxy = await upgrades.deployProxy(V1, [], {
    initializer: "initialize",
    kind: "uups",
  });
    await proxy.deployed();

    await proxy.addFruit("Apple", ethers.utils.parseEther("1"), 10);

    await proxy.connect(buyer).buyFruit(1, 2, {
      value: ethers.utils.parseEther("2"),
    });

    const V2 = await ethers.getContractFactory("FruitMarketV2");
    proxy = await upgrades.upgradeProxy(proxy.address, V2);
  });

  it("should keep old data after upgrade", async function () {
    const quantity = await proxy.getPurchaseQuantity(1, buyer.address);
    expect(quantity.toString()).to.equal("2");
  });

  it("should allow rating after purchase", async function () {
    await proxy.connect(buyer).rateSeller(owner.address, 5);

    const rating = await proxy.getSellerRating(owner.address);
    expect(rating.toString()).to.equal("5");
  });

  it("should prevent rating without purchase", async function () {
    const [, , random] = await ethers.getSigners();

    let reverted = false;

    try {
      await proxy.connect(random).rateSeller(owner.address, 5);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should prevent double rating", async function () {
    await proxy.connect(buyer).rateSeller(owner.address, 5);

    let reverted = false;

    try {
      await proxy.connect(buyer).rateSeller(owner.address, 4);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should compute average rating", async function () {
    const [, , buyer2] = await ethers.getSigners();

    await proxy.connect(buyer).rateSeller(owner.address, 5);

    await proxy.connect(buyer2).buyFruit(1, 1, {
      value: ethers.utils.parseEther("1"),
    });

    await proxy.connect(buyer2).rateSeller(owner.address, 3);

    const rating = await proxy.getSellerRating(owner.address);
    expect(rating.toString()).to.equal("4");
  });

  it("should confirm buyer has bought from seller", async function () {
    const hasBought = await proxy.hasBuyerPurchasedFromSeller(
      buyer.address,
      owner.address
    );

    expect(hasBought).to.equal(true);
  });
});