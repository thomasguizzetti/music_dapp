const { expect } = require("chai");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("MusicDistribution", function () {

  let musicDistribution
  let deployer, artist, user1, user2, users;
  let royaltyFee = toWei(0.01); // 1 ether = 10^18 wei
  let URI = "https://gateway.pinata.cloud/ipfs/QmWwJgr6y6GSA5nrvxsQHjkDsXnEK6g7zsgjwxHwi8vm2K"
  let prices = [toWei(1), toWei(2), toWei(3), toWei(4), toWei(5), toWei(6)]
  let deploymentFees = toWei(prices.length * 0.01)
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const MusicDistributionNFT = await ethers.getContractFactory("MusicDistribution");
    [deployer, artist, user1, user2, ...users] = await ethers.getSigners();

    // Deploy music nft marketplace contract 
    musicDistribution = await MusicDistributionNFT.deploy(
      royaltyFee,
      artist.address,
      prices,
      { value: deploymentFees }
    );

  });

  describe("Deployment", function () {

    it("Should track name, symbol, URI, royalty fee and artist", async function () {
      const nftName = "DAppFi"
      const nftSymbol = "DAPP"
      expect(await musicDistribution.name()).to.equal(nftName);
      expect(await musicDistribution.symbol()).to.equal(nftSymbol);
      expect(await musicDistribution.baseURI()).to.equal(URI);
      expect(await musicDistribution.royaltyFee()).to.equal(royaltyFee);
      expect(await musicDistribution.artist()).to.equal(artist.address);
    });

    it("Should mint then list all the music nfts", async function () {
      expect(await musicDistribution.balanceOf(musicDistribution.address)).to.equal(6);
      // Get each item from the marketItems array then check fields to ensure they are correct
      await Promise.all(prices.map(async (i, indx) => {
        const item = await musicDistribution.marketItems(indx)
        expect(item.tokenId).to.equal(indx)
        expect(item.seller).to.equal(deployer.address)
        expect(item.price).to.equal(i)
      }))
    });
    it("Ether balance should equal deployment fees", async function () {
      expect(await ethers.provider.getBalance(musicDistribution.address)).to.equal(deploymentFees)
    });

  });
  describe("Updating royalty fee", function () {

    it("Only deployer should be able to update royalty fee", async function () {
      const fee = toWei(0.02)
      await musicDistribution.updateRoyaltyFee(fee)
      await expect(
        musicDistribution.connect(user1).updateRoyaltyFee(fee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await musicDistribution.royaltyFee()).to.equal(fee)
    });

  });
  describe("Buying songs", function () {
    it("Should update seller to zero address, transfer NFT, pay seller, pay royalty to artist and emit a MarketItemBought event", async function () {
      const deployerInitalEthBal = await deployer.getBalance()
      const artistInitialEthBal = await artist.getBalance()
      // user1 purchases item.
      await expect(musicDistribution.connect(user1).buySong(0, { value: prices[0] }))
        .to.emit(musicDistribution, "MarketItemBought")
        .withArgs(
          0,
          deployer.address,
          user1.address,
          prices[0]
        )
      const deployerFinalEthBal = await deployer.getBalance()
      const artistFinalEthBal = await artist.getBalance()
      // Item seller should be zero addr
      expect((await musicDistribution.marketItems(0)).seller).to.equal("0x0000000000000000000000000000000000000000")
      // Seller should receive payment for the price of the NFT sold.
      expect(+fromWei(deployerFinalEthBal)).to.equal(+fromWei(prices[0]) + +fromWei(deployerInitalEthBal))
      // Artist should receive royalty
      expect(+fromWei(artistFinalEthBal)).to.equal(+fromWei(royaltyFee) + +fromWei(artistInitialEthBal))
      // The buyer should now own the nft
      expect(await musicDistribution.ownerOf(0)).to.equal(user1.address);
    })
    it("Should fail when ether amount sent with transaction does not equal asking price", async function () {
      // Fails when ether sent does not equal asking price
      await expect(
        musicDistribution.connect(user1).buySong(0, { value: prices[1] })
      ).to.be.revertedWith("Please send the asking price in order to complete the purchase");
    });
  })
  describe("Reselling songs", function () {
    beforeEach(async function () {
      // user1 purchases an item.
      await musicDistribution.connect(user1).buySong(0, { value: prices[0] })
    })

    it("Should track resale item, incr. ether bal by royalty fee, transfer NFT to marketplace and emit MarketItemRelisted event", async function () {
      const resaleprice = toWei(2)
      const initMarketBal = await ethers.provider.getBalance(musicDistribution.address);
      // user1 lists the NFT for a price of 2 Ether, hoping to double their money
      await expect(musicDistribution.connect(user1).resellSong(0, resaleprice, { value: royaltyFee }))
        .to.emit(musicDistribution, "MarketItemRelisted")
        .withArgs(
          0,
          user1.address,
          resaleprice
        );
      const finalMarketBal = await ethers.provider.getBalance(musicDistribution.address);
      // Expect final market balance to equal initial balance plus royalty fee
      expect(finalMarketBal).to.equal(initMarketBal.add(royaltyFee));
      // Owner of NFT should now be the marketplace
      expect(await musicDistribution.ownerOf(0)).to.equal(musicDistribution.address);
      // Get item from items mapping then check fields to ensure they are correct
      const item = await musicDistribution.marketItems(0)
      expect(item.tokenId).to.equal(0)
      expect(item.seller).to.equal(user1.address)
      expect(item.price).to.equal(resaleprice)
    });

    it("Should fail if price is set to zero and royalty fee is not paid", async function () {
      await expect(
        musicDistribution.connect(user1).resellSong(0, 0, { value: royaltyFee })
      ).to.be.revertedWith("Price must be greater than zero");
      await expect(
        musicDistribution.connect(user1).resellSong(0, toWei(1), { value: 0 })
      ).to.be.revertedWith("Must pay royalty");
    });
  });
  describe("Getter functions", function () {
    let soldItems = [0, 1, 4]
    let ownedByUser1 = [0, 1]
    let ownedByUser2 = [4]
    beforeEach(async function () {
      // user1 purchases item 0.
      await (await musicDistribution.connect(user1).buySong(0, { value: prices[0] })).wait();
      // user1 purchases item 1.
      await (await musicDistribution.connect(user1).buySong(1, { value: prices[1] })).wait();
      // user2 purchases item 4.
      await (await musicDistribution.connect(user2).buySong(4, { value: prices[4] })).wait();
    })

    it("getAllUnsoldSongs should fetch all the marketplace items up for sale", async function () {
      const unsoldItems = await musicDistribution.getAllUnsoldSongs()
      // Check to make sure that all the returned unsoldItems have filtered out the sold items.
      expect(unsoldItems.every(i => !soldItems.some(j => j === i.tokenId.toNumber()))).to.equal(true)
      // Check that the length is correct
      expect(unsoldItems.length === prices.length - soldItems.length).to.equal(true)
    });
    it("getMySongs should fetch all tokens the user owns", async function () {
      // Get items owned by user1
      let myItems = await musicDistribution.connect(user1).getMySongs()
      // Check that the returned my items array is correct
      expect(myItems.every(i => ownedByUser1.some(j => j === i.tokenId.toNumber()))).to.equal(true)
      expect(ownedByUser1.length === myItems.length).to.equal(true)
      // Get items owned by user2
      myItems = await musicDistribution.connect(user2).getMySongs()
      // Check that the returned my items array is correct
      expect(myItems.every(i => ownedByUser2.some(j => j === i.tokenId.toNumber()))).to.equal(true)
      expect(ownedByUser2.length === myItems.length).to.equal(true)
    });
  });
})