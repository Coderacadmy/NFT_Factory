//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./interfaces/IFactoryContract.sol";

import '@openzeppelin/contracts/utils/Address.sol';
import './interfaces/IERC721Permit.sol';
import './libraries/ChainId.sol';
import './interfaces/IERC1271.sol';


contract NftToken is  ERC721AUpgradeable , OwnableUpgradeable{

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private tokenIds;
    IFactoryContract private iFactory; 
    string private version = "1";
    bytes32 private nameHash;
    bytes32 private versionHash;
    bytes32 public constant PERMIT_TYPEHASH =
        0x49ecf333e5b8c95c40fdafc95c1ad136e8914a8fb55e9dc8bb01eaa83a2df9ad;

    // Take note of the initializer modifiers.
    // - `initializerERC721A` for `ERC721AUpgradeable`.
    // - `initializer` for OpenZeppelin's `OwnableUpgradeable`.
    function initialize(
        address _owner,
        string memory _name,
        string memory _symbol,
        address _factoryAddress
    ) public initializerERC721A initializer {
       nameHash = keccak256(bytes(_name));
       versionHash = keccak256(bytes(version));
         iFactory = IFactoryContract(_factoryAddress);
        __ERC721A_init(_name, _symbol);
        __Ownable_init();
        _transferOwnership(_owner);
    }

    function mintNFT(address recipient)
        external
        onlyOwner
        returns (uint256)
    {
        tokenIds.increment();
        _safeMint(recipient, tokenIds.current(), bytes("minting nft"));
        
        return tokenIds.current();
    }

    function _getAndIncrementNonce(uint256 tokenId) internal returns (uint256 currentId){
        // tokenId = tokenIds.current();
        currentId = tokenIds.current();
        tokenIds.increment();
    }

     function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    // keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                    0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f,
                    nameHash,
                    versionHash,
                    ChainId.get(),
                    address(this)
                )
            );
    }

    function permit(
        address spender,
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable {
        require(block.timestamp <= deadline, 'Permit expired');

        bytes32 digest =
            keccak256(
                abi.encodePacked(
                    '\x19\x01',
                    DOMAIN_SEPARATOR(),
                    keccak256(abi.encode(PERMIT_TYPEHASH, spender, tokenId, _getAndIncrementNonce(tokenId), deadline))
                )
            );
        address owner = ownerOf(tokenId);
        require(spender != owner, 'ERC721Permit: approval to current owner');

        if (Address.isContract(owner)) {
            require(IERC1271(owner).isValidSignature(digest, abi.encodePacked(r, s, v)) == 0x1626ba7e, 'Unauthorized');
        } else {
            address recoveredAddress = ecrecover(digest, v, r, s);
            require(recoveredAddress != address(0), 'Invalid signature');
            require(recoveredAddress == owner, 'Unauthorized');
        }

        approve(spender, tokenId);
    }

}
