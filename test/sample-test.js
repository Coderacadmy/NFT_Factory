const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const _name = "SSL Token";
const _symbol = "SSL";
const _supply = BigNumber.from("10000000");


const _URI = "thisistestuir.com"


describe("TokenFactory", function () {
  let erc20Contract;
  let token;
  let erc721Contract;
  let nft;

  let factoryContract;
  let tokenFactory;

  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addr6;

  before(async function () {

    // First deploy ERC20 token and ERC721 (nft) token

    // Deploying ERC20
    erc20Contract = await ethers.getContractFactory("ERC20Token");
    token = await erc20Contract.deploy();

    // Deploying ERC721
    erc721Contract = await ethers.getContractFactory("NftToken");
    nft = await erc721Contract.deploy();

    // Deploying Main Factory Contract
    factoryContract = await ethers.getContractFactory("TokenFactory");
    [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();
    tokenFactory = await factoryContract.deploy(nft.address, token.address);

  })

  describe("Deploy Factory Contract", function () {
    it("Factory Contract deployment should set \"pauseAllStatus\" to true", async function () {
      expect(await tokenFactory.getPauseAllStatus()).to.equal(true);
    })

  })

  describe("Deploy ERC20 dynamically", function () {
    describe("Deployment", function () {
      it("Should deploy ERC20 token dynamically.", async function () {

        const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
        const waitData = await tokenDeployed.wait();

        const erc20Addr = waitData.events[3].args.erc20Address;
        const erc20Tkn = erc20Contract.attach(erc20Addr);

        expect(await erc20Tkn.name()).to.equal(_name);
        expect(await erc20Tkn.symbol()).to.equal(_symbol);
        expect(await erc20Tkn.totalSupply()).to.equal(_supply);
        expect(await erc20Tkn.balanceOf(owner.address)).to.equal(_supply);
      });
    })

    describe("Minting Tokens", function () {

      it("Should mint token by owner", async function () {
        const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
        const waitData = await tokenDeployed.wait();

        const erc20Addr = waitData.events[3].args.erc20Address;
        const erc20Tkn = erc20Contract.attach(erc20Addr);

        const preBal = await erc20Tkn.balanceOf(addr1.address);
        await erc20Tkn.mintToken(addr1.address, BigNumber.from("10000"));

        expect(await await erc20Tkn.balanceOf(addr1.address)).to.equal(BigNumber.from("10000").add(preBal));
      })

      it("Should not mint token by non-owner", async function () {
        const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
        const waitData = await tokenDeployed.wait();

        const erc20Addr = waitData.events[3].args.erc20Address;
        const erc20Tkn = erc20Contract.attach(erc20Addr);

        const preBal = await erc20Tkn.balanceOf(addr1.address);
        await expect(erc20Tkn.connect(addr2).mintToken(addr1.address, BigNumber.from("10000"))).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await await erc20Tkn.balanceOf(addr1.address)).to.equal(preBal);
      })

    })

    describe("Burn Tokens", function () {
      let waitData;
      let erc20Tkn;
      before(async function () {

        const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
        waitData = await tokenDeployed.wait();

        const erc20Addr = waitData.events[3].args.erc20Address;
        erc20Tkn = erc20Contract.attach(erc20Addr);
      })

      it("Should burn token by owner", async function () {
        await erc20Tkn.mintToken(addr3.address, BigNumber.from("10000"));
        const preBal = await erc20Tkn.balanceOf(addr3.address);

        await erc20Tkn.burnNft(addr3.address, BigNumber.from("100"))

        expect(await erc20Tkn.balanceOf(addr3.address)).to.equal(preBal.sub(BigNumber.from("100")));
      })

      it("Should not burn token if balance exceeds", async function () {
        await erc20Tkn.mintToken(addr3.address, BigNumber.from("10000"));
        const preBal = await erc20Tkn.balanceOf(addr3.address);
        // minted tokens are 10000, but we are burning 10000 and 1 (10001)
        await expect(erc20Tkn.connect(addr3).burnNft(addr3.address, BigNumber.from("100001"))).to.be.revertedWith("ERC20: burn amount exceeds balance")

      })
    })

    describe("Transfer / Safe Transfer From", function () {
      let waitData;
      let erc20Tkn;
      before(async function () {

        const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
        waitData = await tokenDeployed.wait();

        const erc20Addr = waitData.events[3].args.erc20Address;
        erc20Tkn = erc20Contract.attach(erc20Addr);
      })

      it("Should transfer tokens", async function () {
        await erc20Tkn.mintToken(addr1.address, BigNumber.from("1000000"));
        const preBal = await erc20Tkn.balanceOf(addr2.address);
        // console.log(preBal);
        await erc20Tkn.connect(addr1).approve(addr1.address, BigNumber.from("10000"));
        await erc20Tkn.connect(addr1).transfer(addr2.address, BigNumber.from("100"));

        expect(await await erc20Tkn.balanceOf(addr2.address)).to.equal(BigNumber.from("100").add(preBal));
      })

      it("Should transfer from tokens", async function () {
        await erc20Tkn.mintToken(addr1.address, BigNumber.from("1000000"));
        const preBal = await erc20Tkn.balanceOf(addr2.address);
        // console.log(preBal);
        await erc20Tkn.connect(addr1).approve(addr1.address, BigNumber.from("10000"));
        await erc20Tkn.connect(addr1).transferFrom(addr1.address, addr2.address, BigNumber.from("100"));

        expect(await await erc20Tkn.balanceOf(addr2.address)).to.equal(BigNumber.from("100").add(preBal));
      })
      it("Should not transfer tokens if balance is zero OR not the owner of tokens", async function () {
        // address -> addr3 have no blanace
        await erc20Tkn.connect(addr3).approve(addr3.address, BigNumber.from("10000"));
        await expect(erc20Tkn.connect(addr3).transferFrom(addr3.address, addr2.address, BigNumber.from("100"))).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      })
      it("Should not transfer tokens if insufficient allowance", async function () {
        await erc20Tkn.mintToken(addr3.address, BigNumber.from("100"));

        await erc20Tkn.connect(addr3).approve(addr3.address, BigNumber.from("100"));
        await expect(erc20Tkn.connect(addr3).transferFrom(addr3.address, addr2.address, BigNumber.from("100000"))).to.be.revertedWith("ERC20: insufficient allowance");
      })
      it("Should not transfer tokens if amount exceeds balance", async function () {
        await erc20Tkn.mintToken(addr3.address, BigNumber.from("100"));

        await erc20Tkn.connect(addr3).approve(addr3.address, BigNumber.from("100000"));
        await expect(erc20Tkn.connect(addr3).transferFrom(addr3.address, addr2.address, BigNumber.from("100000"))).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      })
      it("Should not transfer tokens if not owner/approved address of operator", async function () {
        // minting tokens to addr3
        await erc20Tkn.mintToken(addr3.address, BigNumber.from("100"));
        // giving approval to addr2
        await erc20Tkn.connect(addr3).approve(addr2.address, BigNumber.from("100000"));
        // testing non-approved addr4 cannot trasfer
        await expect(erc20Tkn.connect(addr4).transferFrom(addr3.address, addr2.address, BigNumber.from("10"))).to.be.revertedWith("ERC20: insufficient allowance"); // we have not given allowance to addr4
      })


    })

    describe("Allowance/Approval", function () {
      let waitData;
      let erc20Tkn;
      before(async function () {

        const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
        waitData = await tokenDeployed.wait();

        const erc20Addr = waitData.events[3].args.erc20Address;
        erc20Tkn = erc20Contract.attach(erc20Addr);
      })

      it("Should approve operator", async function () {
        // await erc20Tkn.mintToken(addr3.address, BigNumber.from("100"));

        await erc20Tkn.connect(addr3).approve(addr2.address, BigNumber.from("100"));
        expect(await erc20Tkn.allowance(addr3.address, addr2.address)).to.equal(BigNumber.from("100"));
      })


    })

  })

  describe("Deploy ERC721 (NFT) dynamically", function () {

    describe("Deployment", function () {
      it("Should deploy ERC721 token dynamically.", async function () {
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        const erc721Addr = waitData.events[2].args.nftAddress;
        const nftTkn = erc721Contract.attach(erc721Addr);


        expect(await nftTkn.name()).to.equal(_name);
        expect(await nftTkn.symbol()).to.equal(_symbol);
      });
    })

    describe("Minting BFT tokens", function () {
      it("Should mint nft token by owner", async function () {
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        const erc721Addr = waitData.events[2].args.nftAddress;
        const nftTkn = erc721Contract.attach(erc721Addr);

        const newlyMintedNftId = await nftTkn.mintNFT(owner.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        expect(await nftTkn.tokenURI(waitData1.events[0].args.tokenId.toNumber())).to.equal(_URI);

      })

      it("Should give owner of token", async function () {
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        const erc721Addr = waitData.events[2].args.nftAddress;
        const nftTkn = erc721Contract.attach(erc721Addr);

        const newlyMintedNftId = await nftTkn.mintNFT(owner.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        expect(await nftTkn.ownerOf(waitData1.events[0].args.tokenId.toNumber())).to.equal(owner.address);

      })

      it("Should not mint nft token by non-owner", async function () {
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        const erc721Addr = waitData.events[2].args.nftAddress;
        const nftTkn = erc721Contract.attach(erc721Addr);

        await expect(nftTkn.connect(addr1).mintNFT(owner.address, _URI)).to.be.revertedWith("Ownable: caller is not the owner");

      })
    })

    describe("Burn NFT token", function () {
      it("Should burn the nft token", async function () {
        // dynamically deploy nft contract
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        // get deployed nft address, to access contract
        const erc721Addr = waitData.events[2].args.nftAddress;
        const nftTkn = erc721Contract.attach(erc721Addr);

        // get minted nft
        const newlyMintedNftId = await nftTkn.mintNFT(owner.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        // burn nft 
        await nftTkn.burnNft(waitData1.events[0].args.tokenId.toNumber())
        // test the burnNft method of nft token contract success
        await expect(nftTkn.tokenURI(waitData1.events[0].args.tokenId.toNumber())).to.be.revertedWith("ERC721URIStorage: URI query for nonexistent token");

      })

      it("Should not burn the nft token if non owner", async function () {
        // dynamically deploy nft contract
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        // get deployed nft address, to access contract
        const erc721Addr = waitData.events[2].args.nftAddress;
        const nftTkn = erc721Contract.attach(erc721Addr);

        // get minted nft
        const newlyMintedNftId = await nftTkn.mintNFT(owner.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        // test revert burn nft 
        // addr3 is not owner 
        await expect(nftTkn.connect(addr3).burnNft(waitData1.events[0].args.tokenId.toNumber())).to.be.reverted;

      })
    })

    describe("Approval of NFT", function () {
      let nftTkn;
      before(async function () {
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        const erc721Addr = waitData.events[2].args.nftAddress;
        nftTkn = erc721Contract.attach(erc721Addr);
      })
      it("Should approve an operator by owner", async function () {
        const newlyMintedNftId = await nftTkn.mintNFT(owner.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        const tokenId = waitData1.events[0].args.tokenId.toNumber();

        await nftTkn.approve(addr1.address, tokenId);

        expect(await nftTkn.getApproved(tokenId)).to.equal(addr1.address);
      })

      it("Should not approve an operator by non-owner/not approved for all", async function () {
        const newlyMintedNftId = await nftTkn.mintNFT(owner.address, _URI)
        const waitData1 = await newlyMintedNftId.wait(); // waitData1 -> just a name give to varriable to keep data

        const tokenId = waitData1.events[0].args.tokenId.toNumber();

        await expect(nftTkn.connect(addr2).approve(addr1.address, tokenId)).to.be.revertedWith("ERC721: approve caller is not owner nor approved for all");
      })
    })

    describe("Transfermation of nft Token", function () {
      let nftTkn1;
      before(async function () {
        const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
        const waitData = await nftDeployed.wait();

        const erc721Addr = waitData.events[2].args.nftAddress;
        nftTkn1 = erc721Contract.attach(erc721Addr);
      })

      it("Should transfer nft from owner", async function () {
        const newlyMintedNftId = await nftTkn1.mintNFT(addr1.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        const tokenId = waitData1.events[0].args.tokenId.toNumber()
        await nftTkn1.connect(addr1).setApprovalForAll(addr4.address, true);
        // console.log(nftTkn1);

        nftTkn1.connect(addr1)["transferFrom(address,address,uint256)"](addr1.address, addr2.address, tokenId);
        expect(await nftTkn1.ownerOf(tokenId)).to.equal(addr2.address);
      })

      it("Should not transfer nft if not owner/approved", async function () {
        const newlyMintedNftId = await nftTkn1.mintNFT(addr1.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        const tokenId = waitData1.events[0].args.tokenId.toNumber()
        await nftTkn1.connect(addr1).setApprovalForAll(addr4.address, true);
        // console.log(nftTkn1);

        await expect(nftTkn1["transferFrom(address,address,uint256)"](addr1.address, addr2.address, tokenId)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
      })

      it("Should safeTransfer nft from owner", async function () {
        const newlyMintedNftId = await nftTkn1.mintNFT(addr1.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        const tokenId = waitData1.events[0].args.tokenId.toNumber()
        await nftTkn1.connect(addr1).setApprovalForAll(addr4.address, true);
        // console.log(nftTkn1);

        nftTkn1.connect(addr1)["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, tokenId);
        expect(await nftTkn1.ownerOf(tokenId)).to.equal(addr2.address);
      })

      it("Should not safeTransfer nft if not owner/approved", async function () {
        const newlyMintedNftId = await nftTkn1.mintNFT(addr1.address, _URI)
        const waitData1 = await newlyMintedNftId.wait();

        const tokenId = waitData1.events[0].args.tokenId.toNumber()
        await nftTkn1.connect(addr1).setApprovalForAll(addr4.address, true);
        // console.log(nftTkn1);

        await expect(nftTkn1["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, tokenId)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
      })

    })



  })

  describe("Pause Contract.", function () {
    it("Should pause nft token only by owner", async function () {
      // dynamically deploy nft contract
      const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
      const waitData = await nftDeployed.wait();

      // get deployed nft address, to access contract
      const erc721Addr = waitData.events[2].args.nftAddress;
      const nftTkn = erc721Contract.attach(erc721Addr);

      await nftTkn.puaseContract();
      expect(await nftTkn.paused()).to.equal(true);
      await expect(nftTkn.mintNFT(owner.address, _URI)).to.be.revertedWith("Pausable: paused");
    })

    it("Should not pause nft token by non owner", async function () {
      // dynamically deploy nft contract
      const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
      const waitData = await nftDeployed.wait();

      // get deployed nft address, to access contract
      const erc721Addr = waitData.events[2].args.nftAddress;
      const nftTkn = erc721Contract.attach(erc721Addr);

      await expect(nftTkn.connect(addr1).puaseContract()).to.be.revertedWith("Ownable: caller is not the owner");
      
    })

    it("Should pause ERC20 token", async function () {
      // dynamically deploy nft contract
      const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
      const waitData = await tokenDeployed.wait();

      const erc20Addr = waitData.events[3].args.erc20Address;
      const erc20Tkn = erc20Contract.attach(erc20Addr);

      await erc20Tkn.puaseContract();
      expect(await erc20Tkn.paused()).to.equal(true);
      await expect(erc20Tkn.mintToken(owner.address, BigNumber.from("10000"))).to.be.revertedWith("Pausable: paused")

    })

    it("Should not pause ERC20 token by non owner", async function () {
      const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
      const waitData = await tokenDeployed.wait();

      const erc20Addr = waitData.events[3].args.erc20Address;
      const erc20Tkn = erc20Contract.attach(erc20Addr);

      await expect(erc20Tkn.connect(addr1).puaseContract()).to.be.revertedWith("Ownable: caller is not the owner");
      
    })

  })

  describe("Pause All Contracts at once.", function(){
    let nftTkn;
    let erc20Tkn;
    before(async function(){
       // dynamically deploy nft contract
       const nftDeployed = await tokenFactory.createNFT(_name, _symbol);
       const _waitData = await nftDeployed.wait();
 
       // get deployed nft address, to access contract
       const erc721Addr = _waitData.events[2].args.nftAddress;
       nftTkn = erc721Contract.attach(erc721Addr);

        // dynamically deploy nft contract
      const tokenDeployed = await tokenFactory.createToken(_name, _symbol, _supply);
      const waitData = await tokenDeployed.wait();

      const erc20Addr = waitData.events[3].args.erc20Address;
      erc20Tkn = erc20Contract.attach(erc20Addr);
 
    })
    it("Should pause all deployed tokens by owner only", async function () {
      tokenFactory.setPauseAllStatus(false);

      expect(await tokenFactory.getPauseAllStatus()).to.equal(false);
      await expect(erc20Tkn.mintToken(owner.address, BigNumber.from("10000"))).to.be.revertedWith("AllPauseable: All contracts are paused.")
      await expect(nftTkn.mintNFT(owner.address, _URI)).to.be.revertedWith("AllPauseable: All contracts are paused.");


    })

    it("Should not pause all deployed tokens by non owner", async function () {
      await expect(tokenFactory.connect(addr1).setPauseAllStatus(false)).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })




});
