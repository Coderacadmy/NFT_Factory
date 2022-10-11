
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle'); 
require("@nomiclabs/hardhat-etherscan"); 
require('@typechain/hardhat');

module.exports = {
  networks: {
    hardhat: {},
    bsc: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [''],
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
