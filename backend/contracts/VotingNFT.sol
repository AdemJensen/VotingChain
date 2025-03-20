// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./node_modules/@openzeppelin/contracts/access/AccessControl.sol";

contract VotingNFT is ERC721Enumerable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct VotingMetadata {
        address votingContract;
        string role;
        uint256 participationTime;
    }

    mapping(uint256 => VotingMetadata) public tokenMetadata;
    uint256 private nextTokenId;

    constructor() ERC721("VotingParticipation", "VOTE-NFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function addAdmin(address adminAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, adminAddress);
    }

    function removeAdmin(address adminAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, adminAddress);
    }

    function addMinter(address votingContract) external onlyRole(ADMIN_ROLE) {
        grantRole(MINTER_ROLE, votingContract);
    }

    function removeMinter(address votingContract) external onlyRole(ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, votingContract);
    }

    function mint(address user, address votingContract, string memory role) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = nextTokenId;
        _safeMint(user, tokenId);
        tokenMetadata[tokenId] = VotingMetadata(votingContract, role, block.timestamp);
        nextTokenId++;
    }

    function isAuthorizedMinter(address minter) public view returns (bool) {
        return hasRole(MINTER_ROLE, minter);
    }

    // ** 显式重写 supportsInterface 方法 **
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, AccessControl) returns (bool) {
        return ERC721Enumerable.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }
}