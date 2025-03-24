// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./VotingNFT.sol";
import "./node_modules/@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract Manager is AccessControlEnumerable {
    bytes32 public constant ROOT_ROLE = keccak256("ROOT_ROLE");

    struct User {
        address wallet_address;
        string email;
        string nickname;
        string role;
        uint256 create_time;
    }

    string public constant UserRoleUser = "user";
    string public constant UserRoleAdmin = "admin";
    string public constant UserRoleRoot = "root";

    struct Vote {
        address contract_addr;
        address owner_addr;
    }

    address public owner;
    address public nftAddr;

    User[] public users;
    mapping(address => uint256) public userIndex;
    mapping(string => bool) public emailExists;

    Vote[] public votes;
    mapping(address => uint256) public voteIndex;
    mapping(address => address[]) public userVotes;
    address[] public usersInvolved;

    // ============================== Constructors ==================================

    constructor(string memory email, string memory nickname) {
        owner = msg.sender;
        _addUser(address(0), "", "", ""); // add a dummy user to fill the 0 index
        _addUser(owner, email, nickname, UserRoleRoot);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ROOT_ROLE, msg.sender);
    }

    function setNFTAddr(address _nftAddr) external onlyRole(ROOT_ROLE) {
        nftAddr = _nftAddr;
    }

    function getNFTAddr() public view returns (address) {
        return nftAddr;
    }

    // ============================== User Related Functions ==================================

    function addUser(string memory email, string memory nickname) public {
        _addUser(msg.sender, email, nickname, UserRoleUser);
    }

    function _addUser(address walletAddr, string memory email, string memory nickname, string memory role) internal {
        require(userIndex[walletAddr] == 0, "User already exists");
        require(!emailExists[email], "Email already exists");
        userIndex[walletAddr] = users.length;
        users.push(User(walletAddr, email, nickname, role, block.timestamp));
    }

    function userExists(address walletAddr) public view returns (bool) {
        if (walletAddr == address(0)) {
            return false;
        }
        return userIndex[walletAddr] > 0;
    }

    function getUserByAddress(address walletAddr) public view returns (User memory) {
        require(walletAddr != address(0), "Address cannot be 0");
        uint256 index = userIndex[walletAddr];
        if (index == 0) {
            return User(walletAddr, "", "", "", 0);
        }
        return users[index];
    }

    function updateUser(string memory nickname) public {
        uint256 index = userIndex[msg.sender];
        require(index > 0, "User not found");
        users[index].nickname = nickname;
    }

    function _updateUserRole(address walletAddr, string memory role) internal {
        uint256 index = userIndex[walletAddr];
        require(walletAddr != address(0), "Address cannot be 0");
        require(index > 0, "User not found");
        users[index].role = role;
    }

    function addAdmin(address adminAddress) external onlyRole(ROOT_ROLE) {
        require(adminAddress != address(0), "Address cannot be 0");
        require(adminAddress != owner, "Cannot add owner as admin");
        grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _updateUserRole(adminAddress, UserRoleAdmin);
    }

    function removeAdmin(address adminAddress) external onlyRole(ROOT_ROLE) {
        require(adminAddress != address(0), "Address cannot be 0");
        require(adminAddress != owner, "Cannot remove owner from admin list");
        revokeRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _updateUserRole(adminAddress, UserRoleUser);
    }

    function isAdministrator(address adminAddress) public view returns (bool) {
        require(adminAddress != address(0), "Address cannot be 0");
        return hasRole(DEFAULT_ADMIN_ROLE, adminAddress);
    }

    function getAllAdmins() public view returns (address[] memory) {
        uint256 count = getRoleMemberCount(DEFAULT_ADMIN_ROLE);
        address[] memory admins = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            admins[i] = getRoleMember(DEFAULT_ADMIN_ROLE, i);
        }
        return admins;
    }

    // ============================== Vote Related Functions ==================================

    function addVote(address contractAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(votes.length == 0 || votes[voteIndex[contractAddr]].contract_addr != contractAddr, "Vote already exists");

        // grant access
        require(nftAddr != address(0), "NFT contract address not set");
        VotingNFT(nftAddr).addMinter(contractAddr);

        // add to our list
        voteIndex[contractAddr] = votes.length;
        votes.push(Vote(contractAddr, msg.sender));
        userVotes[msg.sender].push(contractAddr);
        usersInvolved.push(msg.sender);
    }

    struct VotePageQueryResult {
        Vote[] votes;
        uint count;
        uint page;
        uint page_size;
        uint total_pages;
    }

    function _newVotePageQueryResult(Vote[] memory votes, uint totalCount, uint page, uint pageSize) public pure returns (VotePageQueryResult memory) {
        return VotePageQueryResult(votes, totalCount, page, pageSize, (totalCount + pageSize - 1) / pageSize);
    }

    function pageQueryVotes(uint page, uint pageSize) public view returns (VotePageQueryResult memory) {
        uint[] memory idxList = _pageQueryListReversed(page, pageSize, votes.length);
        Vote[] memory content = new Vote[](idxList.length);
        for (uint i = 0; i < idxList.length; i++) {
            content[i] = votes[idxList[i]];
        }

        return _newVotePageQueryResult(content, votes.length, page, pageSize);
    }

    function pageQueryUserVotes(uint page, uint pageSize) public view returns (VotePageQueryResult memory) {
        address[] memory userVotesList = userVotes[msg.sender];
        uint[] memory idxList = _pageQueryListReversed(page, pageSize, userVotesList.length);
        Vote[] memory content = new Vote[](idxList.length);
        for (uint i = 0; i < idxList.length; i++) {
            content[i] = votes[voteIndex[userVotesList[idxList[i]]]];
        }

        return _newVotePageQueryResult(content, userVotesList.length, page, pageSize);
    }

    function pageQueryUserParticipatedVotes(uint page, uint pageSize) public view returns (VotePageQueryResult memory) {
        require(nftAddr != address(0), "NFT contract address not set");
        VotingNFT.TokenInfo[] memory tokenList = VotingNFT(nftAddr).pageQueryTokensByUser(msg.sender, page, pageSize);
        Vote[] memory content = new Vote[](tokenList.length);
        for (uint i = 0; i < tokenList.length; i++) {
            content[i] = votes[voteIndex[tokenList[i].metadata.votingContract]];
        }
        return _newVotePageQueryResult(content, VotingNFT(nftAddr).countTokensByUser(msg.sender), page, pageSize);
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
