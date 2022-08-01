
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
   const nfContract = await hre.ethers.getContractFactory("NftToken");
   const nft = await nfContract.deploy();
   await nft.deployed();
 
   console.log("nft address: ", nft.address);

  const [deployer] = await ethers.getSigners();
  const factoryContract = await hre.ethers.getContractFactory("tokenFactory");
  const factory = await factoryContract.deploy(nft.address);
  await factory.deployed();

  console.log("factory address: ", factory.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
