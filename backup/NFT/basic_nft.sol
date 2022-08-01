//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../interfaces/IFactoryContract.sol";

contract nftToken is
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private tokenIds;

    IFactoryContract private iFactory;

    modifier NotPauseAllContracts() {
        require(
            iFactory.getPauseAllStatus() == true,
            "AllPauseable: All contracts are paused."
        );
        _;
    }

    function initialize(
        address _owner,
        string memory _name,
        string memory _symbol,
        address _factoryAddress
    ) public initializer {
        iFactory = IFactoryContract(_factoryAddress);
        __ERC721_init(_name, _symbol);
        _transferOwnership(_owner);
    }

    function mintNFT(address recipient, string memory _tokenURI)
        external
        onlyOwner
        NotPauseAllContracts
        whenNotPaused
        returns (uint256)
    {
        tokenIds.increment();
        _safeMint(recipient, tokenIds.current(), bytes("minting nft"));
        _setTokenURI(tokenIds.current(), _tokenURI);
        return tokenIds.current();
    }

    function burnNft(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }
}
