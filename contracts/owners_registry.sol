//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract OwnersRegistry {

    address[] private nftTokenOwners;

    // addr of contract => (owner address =>  index of array(erc20TokenOwners/nftTokenOwners) )
    mapping(address=> mapping(address=> uint256)) tokenOwners;

    // constructor(){
    //     erc20TokenOwners.push();
    //     nftTokenOwners.push();
    // }

    function setNFTTokenOwner(address _contractAddress, address _owenerAddress) internal {
        nftTokenOwners.push();
        uint256 index = nftTokenOwners.length -1;

        nftTokenOwners[index] = _contractAddress;
        tokenOwners[_contractAddress][_owenerAddress] = index;
    }

    function getNFTTokenOwner(address _contractAddress, address _owenerAddress) internal view returns(address){
        uint256 index = tokenOwners[_contractAddress][_owenerAddress];
        return nftTokenOwners[index];
    }
}