// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./VotingNFT.sol";

contract Voting {
    VotingNFT public votingNFT;
    address public admin;

    constructor(address _nftContract) {
        votingNFT = VotingNFT(_nftContract);
        admin = msg.sender;
    }

    function registerVoter() public {
        require(votingNFT.isAuthorizedMinter(address(this)), "Voting contract not authorized");
        votingNFT.mint(msg.sender, address(this), "voter");
    }

    function registerCandidate() public {
        require(votingNFT.isAuthorizedMinter(address(this)), "Voting contract not authorized");
        votingNFT.mint(msg.sender, address(this), "candidate");
    }
}