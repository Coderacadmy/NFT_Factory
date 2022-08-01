// require('@typechain/hardhat')
// require('@nomiclabs/hardhat-ethers')
// require('@nomiclabs/hardhat-waffle')

// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// // You need to export an object to set up your config
// // Go to https://hardhat.org/config/ to learn more

// /**
//  * @type import('hardhat/config').
//  */

// const API_KEY = "d56ee36b62fc46cbad3781027cb5cdcb";
// const Ropsten_PRIVATE_KEY = "d20bd32d2431d8543982f40b6205b3f5ce86b990109ed2413b36b3f121881247";
// module.exports = {
//   solidity: "0.8.4",
//   networks: {
//     ropsten: {
//       url: `https://ropsten.infura.io/v3/${API_KEY}`,
//       accounts: [`0x${Ropsten_PRIVATE_KEY}`],
//     },
//   },
// };



require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle'); 
require("@nomiclabs/hardhat-etherscan"); 
require('@typechain/hardhat');

module.exports = {
  networks: {
    hardhat: {},
    bsc: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: ['f82028d77f66317095668a3dd5d039a45ded3d94d0303940142d99ac20bd1d65'],
    },
  },
  watcher: {
    compilation: {
      tasks: ["compile"],
      files: ["./contracts"],
      verbose: true,
    },
    ci: {
      tasks: ["clean", {command: "compile", params: {quiet: true}}, {
        command: "test",
        params: {noCompile: true, testFiles: ["testfile.ts"]}
      }],
    }
  },
  etherscan: {
    apiKey: "BAAEAZI3GTB8V4GJTR8VV2SUNK9MB31V4Z"             // BSC API Key
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4"
      },
      {
        version: "0.7.6"
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  }
}