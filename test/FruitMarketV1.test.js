const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FruitMarketV1", function () {
  let contract, owner, buyer, other;

  beforeEach(async function () {
    [owner, buyer, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FruitMarketV1");
    contract = await Factory.deploy();
    await contract.deployed();
  });

  it("should add a fruit", async function () {
    await contract.addFruit("Apple", ethers.utils.parseEther("1"), 10);

    const fruit = await contract.getFruit(1);

    expect(fruit[1]).to.equal("Apple");
    expect(fruit[3].toString()).to.equal("10");
    expect(fruit[5]).to.equal(true);
  });

  it("should reject addFruit with zero price", async function () {
    let reverted = false;

    try {
      await contract.addFruit("Apple", 0, 10);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should reject addFruit with zero stock", async function () {
    let reverted = false;

    try {
      await contract.addFruit("Apple", ethers.utils.parseEther("1"), 0);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should allow buying a fruit", async function () {
    await contract.addFruit("Banana", ethers.utils.parseEther("1"), 10);

    await contract.connect(buyer).buyFruit(1, 2, {
      value: ethers.utils.parseEther("2"),
    });

    const quantity = await contract.getPurchaseQuantity(1, buyer.address);
    const fruit = await contract.getFruit(1);

    expect(quantity.toString()).to.equal("2");
    expect(fruit[3].toString()).to.equal("8");
  });

  it("should reject buyFruit with wrong payment", async function () {
    await contract.addFruit("Banana", ethers.utils.parseEther("1"), 10);

    let reverted = false;

    try {
      await contract.connect(buyer).buyFruit(1, 2, {
        value: ethers.utils.parseEther("1"),
      });
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should reject buyFruit if stock is insufficient", async function () {
    await contract.addFruit("Banana", ethers.utils.parseEther("1"), 2);

    let reverted = false;

    try {
      await contract.connect(buyer).buyFruit(1, 3, {
        value: ethers.utils.parseEther("3"),
      });
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should reject buyFruit if fruit is inactive", async function () {
    await contract.addFruit("Banana", ethers.utils.parseEther("1"), 10);
    await contract.removeFruit(1);

    let reverted = false;

    try {
      await contract.connect(buyer).buyFruit(1, 1, {
        value: ethers.utils.parseEther("1"),
      });
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should store purchase history", async function () {
    await contract.addFruit("Orange", ethers.utils.parseEther("1"), 10);

    await contract.connect(buyer).buyFruit(1, 3, {
      value: ethers.utils.parseEther("3"),
    });

    const count = await contract.connect(buyer).getPurchaseHistoryCount();
    const item = await contract.connect(buyer).getPurchaseHistoryItem(0);

    expect(count.toString()).to.equal("1");
    expect(item[0].toString()).to.equal("1");
    expect(item[1]).to.equal("Orange");
    expect(item[2]).to.equal(buyer.address);
    expect(item[3]).to.equal(owner.address);
    expect(item[4].toString()).to.equal("3");
  });

  it("should store sales history", async function () {
    await contract.addFruit("Mango", ethers.utils.parseEther("1"), 10);

    await contract.connect(buyer).buyFruit(1, 2, {
      value: ethers.utils.parseEther("2"),
    });

    const count = await contract.connect(owner).getSalesHistoryCount();
    const item = await contract.connect(owner).getSalesHistoryItem(0);

    expect(count.toString()).to.equal("1");
    expect(item[0].toString()).to.equal("1");
    expect(item[1]).to.equal("Mango");
    expect(item[2]).to.equal(buyer.address);
    expect(item[3]).to.equal(owner.address);
    expect(item[4].toString()).to.equal("2");
  });

  it("should handle multiple purchases", async function () {
    await contract.addFruit("Pineapple", ethers.utils.parseEther("1"), 10);

    await contract.connect(buyer).buyFruit(1, 1, {
      value: ethers.utils.parseEther("1"),
    });

    await contract.connect(buyer).buyFruit(1, 2, {
      value: ethers.utils.parseEther("2"),
    });

    const count = await contract.connect(buyer).getPurchaseHistoryCount();
    const item1 = await contract.connect(buyer).getPurchaseHistoryItem(0);
    const item2 = await contract.connect(buyer).getPurchaseHistoryItem(1);

    expect(count.toString()).to.equal("2");
    expect(item1[4].toString()).to.equal("1");
    expect(item2[4].toString()).to.equal("2");
  });

  it("should revert for invalid purchase history index", async function () {
    await contract.addFruit("Kiwi", ethers.utils.parseEther("1"), 10);

    let reverted = false;

    try {
      await contract.connect(buyer).getPurchaseHistoryItem(0);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should revert for invalid sales history index", async function () {
    await contract.addFruit("Kiwi", ethers.utils.parseEther("1"), 10);

    let reverted = false;

    try {
      await contract.getSalesHistoryItem(0);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should allow seller to update a fruit", async function () {
    await contract.addFruit("Apple", ethers.utils.parseEther("1"), 10);

    await contract.updateFruit(1, ethers.utils.parseEther("2"), 15);

    const fruit = await contract.getFruit(1);

    expect(fruit[2].toString()).to.equal(ethers.utils.parseEther("2").toString());
    expect(fruit[3].toString()).to.equal("15");
  });

  it("should reject updateFruit from non-seller", async function () {
    await contract.addFruit("Apple", ethers.utils.parseEther("1"), 10);

    let reverted = false;

    try {
      await contract.connect(other).updateFruit(1, ethers.utils.parseEther("2"), 15);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should allow seller to remove a fruit", async function () {
    await contract.addFruit("Apple", ethers.utils.parseEther("1"), 10);

    await contract.removeFruit(1);

    const fruit = await contract.getFruit(1);
    expect(fruit[5]).to.equal(false);
  });

  it("should reject removeFruit from non-seller", async function () {
    await contract.addFruit("Apple", ethers.utils.parseEther("1"), 10);

    let reverted = false;

    try {
      await contract.connect(other).removeFruit(1);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });
});