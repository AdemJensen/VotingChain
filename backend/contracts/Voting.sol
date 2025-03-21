// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./VotingNFT.sol";

contract Voting {
    VotingNFT public votingNFT;

    enum OptionType { Candidate, RawText }
    enum State { Init, Registration, Voting, Ended }
    string public constant UserVoteRoleVoter = "voter";
    string public constant UserVoteRoleCandidate = "candidate";

    struct Option {
        int id; // starts from 1
        string rawText;
        address candidate;
    }

    struct Vote {
        int version;
        address admin;
        string title;
        string description;
        OptionType optionType;
        bool needRegistration;
        State state;
        Option[] options;
    }

    Vote public vote;

    constructor(
        address _nftContract,
        string memory _title,
        string memory _description,
        OptionType _optionType,
        bool _needRegistration,
        string[] memory _raw_text_options
    ) {
        votingNFT = VotingNFT(_nftContract);
        votingNFT.addMinter(address(this));

        vote.version = 1;
        vote.admin = msg.sender;
        vote.title = _title;
        vote.description = _description;
        vote.optionType = _optionType;
        vote.needRegistration = _needRegistration;
        vote.state = State.Init;

        if (_optionType == OptionType.RawText) {
            for (uint i = 0; i < _raw_text_options.length; i++) {
                vote.options.push(Option({
                    id: int(i) + 1,
                    rawText: _raw_text_options[i],
                    candidate: address(0)
                }));
            }
        }
    }

    function getVote() public view returns (Vote memory) {
        return vote;
    }

    function isOwner(address addr) public view returns (bool) {
        return addr == vote.admin;
    }

    function hasRegistrationState() public view returns (bool) {
        return vote.optionType == OptionType.Candidate || vote.needRegistration;
    }

    function getNextState() public view returns (State) {
        if (vote.state == State.Init) {
            if (hasRegistrationState()) {
                return State.Registration;
            } else {
                return State.Voting;
            }
        } else if (vote.state == State.Registration) {
            return State.Voting;
        } else if (vote.state == State.Voting) {
            return State.Ended;
        } else {
            return State.Ended;
        }
    }

    function registerVoter() public {
        require(votingNFT.isAuthorizedMinter(address(this)), "Voting contract not authorized");
        require(vote.state == State.Registration || (vote.state == State.Voting && vote.needRegistration == false), "Voting contract not in registration state");
        votingNFT.mint(msg.sender, address(this), UserVoteRoleVoter);
    }

    function registerCandidate() public {
        require(votingNFT.isAuthorizedMinter(address(this)), "Voting contract not authorized");
        require(vote.optionType == OptionType.Candidate, "Voting contract does not support candidate registration");
        votingNFT.mint(msg.sender, address(this), UserVoteRoleCandidate);
        // add the candidate as an option
        vote.options.push(Option({
            id: int(vote.options.length) + 1,
            rawText: "",
            candidate: msg.sender
        }));
    }

    // option starts from 1
    function doVote(int option) public {
        require(votingNFT.isAuthorizedMinter(address(this)), "Voting contract not authorized");
        require(vote.state == State.Voting, "Voting contract not in voting state");
        require(votingNFT.getUserOptionInVoting(msg.sender, address(this)) == 0, "User already voted");
        require(!compareStrings(votingNFT.getUserRoleInVoting(msg.sender, address(this)), UserVoteRoleCandidate), "User is not a voter but a candidate");
        require(!vote.needRegistration || compareStrings(votingNFT.getUserRoleInVoting(msg.sender, address(this)), UserVoteRoleVoter), "User is not registered as a voter");

        // check if the option is valid
        bool found = false;
        for (uint i = 0; i < vote.options.length; i++) {
            if (vote.options[i].id == option) {
                found = true;
                break;
            }
        }
        require(found, "Option not found");

        if (!vote.needRegistration) {
            // if registration is not needed, register the user as a voter automatically
            registerVoter();
        }
        votingNFT.updateTokenOption(votingNFT.getUserTokenInVoting(msg.sender, address(this)), option);
    }

    function compareStrings(string memory _a, string memory _b) internal pure returns(bool) {
        return keccak256(abi.encodePacked(_a)) == keccak256(abi.encodePacked(_b));
    }
}