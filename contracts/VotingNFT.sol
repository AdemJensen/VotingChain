// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./node_modules/@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract VotingNFT is ERC721Enumerable, AccessControlEnumerable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct VotingMetadata {
        address votingContract;
        string role;
        int option;
    }

    mapping(uint256 => VotingMetadata) public tokenMetadata;
    mapping(address => uint256[]) public userTokens;
    mapping(address => uint256[]) public voteTokens;

    uint256 private nextTokenId;

    address public managerAddr;

    constructor(address _managerAddr) ERC721("VotingParticipation", "VOTE-NFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, _managerAddr);
        nextTokenId = 1;
    }

    // ============================== Minter Related Functions ==================================

    function addMinter(address votingContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, votingContract);
    }

    function removeMinter(address votingContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, votingContract);
    }

    function isAuthorizedMinter(address minter) public view returns (bool) {
        return hasRole(MINTER_ROLE, minter);
    }

    // ============================== NFT Related Functions ==================================

    function getUserTokens(address user) public view returns (uint256[] memory) {
        return userTokens[user];
    }

    function getVoteTokens(address votingContract) public view returns (uint256[] memory) {
        return voteTokens[votingContract];
    }

    function getVotingMetadata(uint256 tokenId) public view returns (VotingMetadata memory) {
        return tokenMetadata[tokenId];
    }

    function getUserTokenInVoting(address user, address votingContract) public view returns (uint256) {
        uint256[] storage voteTokensList = voteTokens[votingContract];
        for (uint256 i = 0; i < voteTokensList.length; i++) {
            uint256 tokenId = voteTokensList[i];
            if (tokenId == 0) {
                continue;
            }
            if (ownerOf(tokenId) == user) {
                return tokenId;
            }
        }
        return 0;
    }

    function getUserRoleInVoting(address user, address votingContract) public view returns (string memory) {
        uint256 tokenId = getUserTokenInVoting(user, votingContract);
        if (tokenId == 0) {
            return "";
        }
        return tokenMetadata[tokenId].role;
    }

    function getUserOptionInVoting(address user, address votingContract) public view returns (int) {
        uint256 tokenId = getUserTokenInVoting(user, votingContract);
        if (tokenId == 0) {
            return 0;
        }
        return tokenMetadata[tokenId].option;
    }

    function mint(address user, address votingContract, string memory role) external onlyRole(MINTER_ROLE) {
        require(compareStrings(getUserRoleInVoting(user, votingContract), ""), "User already minted a token for this voting contract");
        uint256 tokenId = nextTokenId;
        _safeMint(user, tokenId);
        tokenMetadata[tokenId] = VotingMetadata(votingContract, role, 0);
        userTokens[user].push(tokenId);
        voteTokens[votingContract].push(tokenId);
        nextTokenId++;
    }

    function updateTokenOption(uint256 tokenId, int option) external onlyRole(MINTER_ROLE) {
        if (tokenId == 0) {
            revert("Token does not exist (Zero value)");
        }
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        tokenMetadata[tokenId].option = option;
    }

    function updateTokenRole(uint256 tokenId, string memory role) external onlyRole(MINTER_ROLE) {
        if (tokenId == 0) {
            revert("Token does not exist (Zero value)");
        }
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        tokenMetadata[tokenId].role = role;
    }

    function getAllTokenIdsByVotingContract(address votingContract) public view returns (uint256[] memory) {
        return voteTokens[votingContract];
    }

    function getAllTokenIdsByUser(address user) public view returns (uint256[] memory) {
        return userTokens[user];
    }

    struct TokenInfo {
        uint256 tokenId;
        address owner;
        VotingMetadata metadata;
    }
    function getAllTokensByVotingContract(address votingContract) public view returns (TokenInfo[] memory) {
        uint256[] memory tokenIds = getAllTokenIdsByVotingContract(votingContract);
        TokenInfo[] memory tokens = new TokenInfo[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokens[i] = TokenInfo(tokenIds[i], ownerOf(tokenIds[i]), tokenMetadata[tokenIds[i]]);
        }
        return tokens;
    }

    function getAllTokensByUser(address user) public view returns (TokenInfo[] memory) {
        uint256[] memory tokenIds = getAllTokenIdsByUser(user);
        TokenInfo[] memory tokens = new TokenInfo[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokens[i] = TokenInfo(tokenIds[i], ownerOf(tokenIds[i]), tokenMetadata[tokenIds[i]]);
        }
        return tokens;
    }

    function pageQueryTokensByUser(address user, uint page, uint pageSize) public view returns (TokenInfo[] memory) {
        uint256[] memory tokenIds = getAllTokenIdsByUser(user);
        uint256[] memory pageTokenIdsIdx = _pageQueryListReversed(page, pageSize, tokenIds.length);
        TokenInfo[] memory tokens = new TokenInfo[](pageTokenIdsIdx.length);
        for (uint256 i = 0; i < pageTokenIdsIdx.length; i++) {
            tokens[i] = TokenInfo(tokenIds[pageTokenIdsIdx[i]], ownerOf(tokenIds[pageTokenIdsIdx[i]]), tokenMetadata[tokenIds[pageTokenIdsIdx[i]]]);
        }
        return tokens;
    }

    function countTokensByUser(address user) public view returns (uint) {
        return userTokens[user].length;
    }

    // ** 显式重写 supportsInterface 方法 **
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, AccessControlEnumerable) returns (bool) {
        return ERC721Enumerable.supportsInterface(interfaceId) || AccessControlEnumerable.supportsInterface(interfaceId);
    }

    function compareStrings(string memory _a, string memory _b) internal pure returns(bool) {
        return keccak256(abi.encodePacked(_a)) == keccak256(abi.encodePacked(_b));
    }

    // ============================== Utility Functions ==================================

    function _pageQueryListReversed(uint page, uint pageSize, uint total) public pure returns (uint[] memory) {
        require(pageSize > 0, "Page size must be > 0");

        uint pageNumber = page - 1;
        uint startIndex;

        // pageNumber 从 0 开始计数
        if ((pageNumber + 1) * pageSize > total) {
            // 最后一页可能不满
            if (pageNumber * pageSize >= total) {
                // 超出边界
                return new uint[](0);
            }
            startIndex = 0;
        } else {
            startIndex = total - (pageNumber + 1) * pageSize;
        }

        uint endIndex = total - pageNumber * pageSize;
        uint length = endIndex - startIndex;

        uint[] memory page = new uint[](length);
        for (uint i = 0; i < length; i++) {
            // 逆序读取
            page[i] = endIndex - 1 - i;
        }

        return page;
    }
}