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

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";

contract NftToken is  ERC721AUpgradeable, OwnableUpgradeable, EIP712Upgradeable 
{


    using ECDSA for bytes32;
    using SafeMath for uint256;

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private tokenIds;
    IFactoryContract private iFactory; 


    string public contractURI_;
    uint96 royaltyFeesInBips;
    address royaltyAddress;

    // Contract URI
    string public contractMetaData;
    address rootOwner;


    string private version = "1";
    bytes32 private nameHash;
    bytes32 private versionHash;
    bytes32 public constant PERMIT_TYPEHASH =
        0x49ecf333e5b8c95c40fdafc95c1ad136e8914a8fb55e9dc8bb01eaa83a2df9ad;
    
    struct RAROIN_NFT {
        uint256 tokenId;
        uint256 minPrice;
        string uri;
    }


     /* All token ids */
    uint256[] private allTokenIds;

    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public tokenSupply;
    mapping(uint256 => string) customUri;
    /* mapping from tokenId => artist address  */
    mapping(uint256 => address) public artists;
    /* mapping from artist address => tokenIds  */
    mapping(address => uint256[]) public artistsNFTs;

    // Event
    event URI(string _newURI, uint256 _tokenId);
    event NewPowerFan(uint256 indexed tokenId, address artist);

    // Modifiers
    modifier creatorOnly(uint256 _id){
        require(
        creators[_id] == _msgSender(),
        "Can be accesed by root or creator of token only"
        );
        _;
    }

    modifier ownerOnly(){
        require(
        owner() == _msgSender(),
        "Can be accesed by root or collection Owner only"
        );
        _;
    }

    modifier ownerAndRootOnly(){
        require(
        owner() == _msgSender() || rootOwner == _msgSender(),
        "Can be accesed by root or collection Owner only"
        );
        _;
    }

    modifier creatorAndRootOnly(uint256 _id){
        require(
        creators[_id] == _msgSender() || rootOwner == _msgSender(),
        "Can be accesed by root or creator of token only"
        );
        _;
    }


    function initialize(
        address _rootOwner,
        address creator,
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint96 _royaltyFeesInBips,
        address _factoryAddress
    ) public initializerERC721A initializer {
       rootOwner = _rootOwner; 
       royaltyFeesInBips = _royaltyFeesInBips; 
       royaltyAddress = owner();
       contractMetaData = _uri; 
       nameHash = keccak256(bytes(_name));
       versionHash = keccak256(bytes(version));
         iFactory = IFactoryContract(_factoryAddress);
        __ERC721A_init(_name, _symbol);
        __Ownable_init();
        _transferOwnership(creator);
    }

    function mintRagoinNFT(RAROIN_NFT calldata nft, bytes memory signature)
        public
        payable
    {
        address signer = _verify(nft, signature);
        require(msg.value >= nft.minPrice, "Insufficient funds to buy");
        artists[nft.tokenId] = signer;
        artistsNFTs[signer].push(nft.tokenId);

        _mint(msg.sender, nft.tokenId);
        customUri[nft.tokenId] = nft.uri;
        require(
            payable(signer).send(nft.minPrice),
            "PRICE MUST BE LARGER THAN FEE"
        );
        emit NewPowerFan(nft.tokenId, signer);
    }



    function create(
        address _initialOwner,
        uint256 _id,
        string memory _uri
    ) public ownerAndRootOnly returns (uint256) {
        
        creators[_id] = _msgSender();

        if (bytes(_uri).length > 0) {
            customUri[_id] = _uri;
            emit URI(_uri, _id);
        }

        _mint(_initialOwner, _id);
        return _id;
    }

    

    // function mint(
    //     address _to,
    //     uint256 _id,
    //     uint256 _quantity
    // ) public creatorOnly(_id) {
    //     _mint(_to, _quantity);
    //     tokenSupply[_id] = tokenSupply[_id].add(_quantity);
    // }


    function mintNFT(address recipient)
        external
        onlyOwner
        returns (uint256)
    {
        tokenIds.increment();
        _safeMint(recipient, tokenIds.current(), bytes("minting nft"));
        
        return tokenIds.current();
    }

    /**
     * @dev Change the creator address for given tokens
     * @param _to   Address of the new creator
     * @param _ids  Array of Token IDs to change creator
     */
    function setCreator(address _to, uint256[] memory _ids) public {
        require(
            _to != address(0),
            "ERC1155Tradable#setCreator: INVALID_ADDRESS."
        );
        for (uint256 i = 0; i < _ids.length; i++) {
            uint256 id = _ids[i];
            _setCreator(_to, id);
        }
    }

    /**
     * @dev Change the creator address for given token
     * @param _to   Address of the new creator
     * @param _id  Token IDs to change creator of
     */
    function _setCreator(address _to, uint256 _id)
        internal
        creatorAndRootOnly(_id)
    {
        creators[_id] = _to;
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

    function setURI(string memory _newURI) public ownerOnly {
        setURI(_newURI);
    }

    function setCustomURI(uint256 _tokenId, string memory _newURI)
        public
        creatorOnly(_tokenId)
    {
        customUri[_tokenId] = _newURI;
        emit URI(_newURI, _tokenId);
    }

    function contractURI() public view returns (string memory) {
        return contractMetaData;
    }

    function setContractURI(string memory _contractURI) public onlyOwner {
        contractMetaData = _contractURI;
    }



    function _hash(RAROIN_NFT calldata nft) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "RAROIN_NFT(uint256 tokenId,uint256 minPrice,string uri)"
                        ),
                        nft.tokenId,
                        nft.minPrice,
                        keccak256(bytes(nft.uri))
                    )
                )
            );
    }

    function _verify(RAROIN_NFT calldata nft, bytes memory signature)
        internal
        view
        returns (address)
    {
        bytes32 digest = _hash(nft);
        return digest.toEthSignedMessageHash().recover(signature);
    }


    function setRoyaltyInfo(address _receiver, uint96 _royaltyFeesInBips) public onlyOwner {
        royaltyAddress = _receiver;
        royaltyFeesInBips = _royaltyFeesInBips;
    }
    
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address, uint256)
    {
        return (royaltyAddress, calculateRoyalty(_salePrice));
    }
    
    function calculateRoyalty(uint256 _salePrice) view public returns (uint256) {
        return (_salePrice / 10000) * royaltyFeesInBips;
    }

    function supportsInterface(bytes4 interfaceId)
            public
            view
            override(ERC721AUpgradeable)
            returns (bool)
    {
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }

}
