//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./NftToken.sol";
import "./owners_registry.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract tokenFactory is Ownable, OwnersRegistry {

    address public superNftTokenAddress;
    NftToken[] public deployedNftTokens; // we make this provate latter

    event NftCreated(address nftAddress, address ownerAddress, uint256 index);

     // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;
     // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    constructor(address _NFTaddress) {
        superNftTokenAddress = _NFTaddress;
    }

    function createNFT(string memory _name, string memory _symbol, string memory _uri, uint96 _royaltyFeeInBips ) public {
        address clonedNftAddress = Clones.clone(superNftTokenAddress);
        NftToken nft = NftToken(clonedNftAddress);
        nft.initialize(msg.sender, msg.sender, _name, _symbol, _uri, _royaltyFeeInBips, address(this));
      
        deployedNftTokens.push(nft);
        // get deployer of this contract
        setNFTTokenOwner(clonedNftAddress, msg.sender);

        emit NftCreated(clonedNftAddress, msg.sender, (deployedNftTokens.length - 1));
    }

}
