import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Web3 from "web3";
import VotingJson from "../artifacts/contracts_Voting_sol_Voting.json";
import VotingNFTJson from "../artifacts/contracts_VotingNFT_sol_VotingNFT.json";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import {
    getCurrentUser,
    getCurrentUserInfo,
    normalizeHex0x
} from "../utils/token";
import { getVotingNftAddr } from "../utils/backend";

const STATE_MAP = ["Init", "Registration", "Voting", "Ended"];
const OPTION_TYPE_MAP = {
    0: "Candidate Registration Mode",
    1: "Predefined Text Options"
};

export default function VoteDetails() {
    const { contract } = useParams();
    const [web3, setWeb3] = useState(null);
    const [user, setUser] = useState(null);
    const [voteInfo, setVoteInfo] = useState(null);
    const [userRole, setUserRole] = useState("");
    const [hasVoted, setHasVoted] = useState(false);
    const [canVote, setCanVote] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [hasRegistrationState, setHasRegistrationState] = useState(false);
    const [currentState, setCurrentState] = useState(0);
    const [options, setOptions] = useState([]);
    const [userOption, setUserOption] = useState(0n);
    const [voteCounts, setVoteCounts] = useState({});

    useEffect(() => {
        if (window.ethereum) {
            setWeb3(new Web3(window.ethereum));
        } else {
            alert("Please install MetaMask");
        }
        getCurrentUserInfo().then(setUser);
    }, []);

    useEffect(() => {
        if (web3 && user) {
            loadVoteDetails();
        }
    }, [web3, user]);

    const loadVoteDetails = async () => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            const votingNFT = new web3.eth.Contract(VotingNFTJson.abi, await getVotingNftAddr());
            const currentUser = normalizeHex0x(getCurrentUser());
            if (currentUser === "0x") {
                window.location.href = "/login";
            }

            const vote = await voting.methods.getVote().call();
            const role = await votingNFT.methods.getUserRoleInVoting(currentUser, contract).call();
            const votedOption = await votingNFT.methods.getUserOptionInVoting(currentUser, contract).call();
            const isOwner = await voting.methods.isOwner(currentUser).call();
            const regState = await voting.methods.hasRegistrationState().call();
            const userOpt = await votingNFT.methods.getUserOptionInVoting(currentUser, contract).call();
            const allTokens = await votingNFT.methods.getAllTokensByVotingContract(contract).call();

            const voteCounter = {};
            allTokens.forEach(t => {
                if (t.role !== "voter") return;
                const optId = t.option;
                if (!voteCounter[optId]) voteCounter[optId] = 0;
                voteCounter[optId]++;
            });

            setVoteInfo(vote);
            setIsAdmin(isOwner);
            setUserRole(role);
            const hv = votedOption !== 0n;
            setHasVoted(hv);
            setHasRegistrationState(regState);
            setCurrentState(parseInt(vote.state));
            setOptions(vote.options);
            console.log("Vote info: ", vote);
            setCanVote(vote.state === 2n && (role === "voter" || role === "" && !vote.needRegistration) && !hv);
            console.log("User Role: ", role);
            console.log("voteInfo.needRegistration: ", vote.needRegistration);
            console.log("hasVoted: ", hv);
            console.log("userOpt: ", userOpt);
            console.log("Options: ", vote.options);
            setUserOption(parseInt(userOpt));
            setVoteCounts(voteCounter);
        } catch (err) {
            console.error("Failed to load vote details:", err);
        }
    };

    const handleRegisterCandidate = async () => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.registerCandidate().send({ from: normalizeHex0x(getCurrentUser()) });
            alert("Candidate registration successful!");
            loadVoteDetails();
        } catch (err) {
            alert("Registration failed: " + err.message);
        }
    };

    const handleRegisterVoter = async () => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.registerVoter().send({ from: normalizeHex0x(getCurrentUser()) });
            alert("Candidate registration successful!");
            loadVoteDetails();
        } catch (err) {
            alert("Registration failed: " + err.message);
        }
    };

    const handleVote = async (optionId) => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.doVote(optionId).send({ from: normalizeHex0x(getCurrentUser()) });
            alert("Vote successful!");
            loadVoteDetails();
        } catch (err) {
            alert("Voting failed: " + err.message);
        }
    };

    const handleNextState = async () => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.nextState().send({ from: normalizeHex0x(getCurrentUser()) });
            alert("State updated!");
            loadVoteDetails();
        } catch (err) {
            alert("State change failed: " + err.message);
        }
    };

    if (!voteInfo || !user) return <div className="p-10 text-gray-500">Loading vote details...</div>;

    const totalVotes = Object.values(voteCounts).reduce((acc, val) => acc + val, 0);

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 text-gray-800">
            <TopNav />
            <div className="flex flex-1">
                <Sidebar role={user?.role} currentPanel="Vote Details" className="w-1/5 bg-gray-100" />

                <main className="flex-1 p-10 overflow-y-auto">
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-6">
                        <h2 className="text-3xl font-extrabold">{voteInfo.title}</h2>
                        <p className="text-gray-700 mb-4">{voteInfo.description}</p>

                        <table className="w-full text-left text-sm border-t border-gray-200">
                            <tbody>
                            <tr><td className="font-semibold">Contract Address:</td><td className="font-mono break-all bg-gray-100 p-2 rounded">{contract}</td></tr>
                            <tr><td className="font-semibold">Current State:</td><td className="bg-blue-100 text-blue-800 px-3 py-1 rounded">{STATE_MAP[currentState]}</td></tr>
                            <tr><td className="font-semibold">Option Type:</td><td className="bg-purple-100 text-purple-800 px-3 py-1 rounded">{OPTION_TYPE_MAP[voteInfo.optionType]}</td></tr>
                            <tr><td className="font-semibold">Need Voter Registration:</td><td className={`px-3 py-1 rounded ${voteInfo.needRegistration ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>{voteInfo.needRegistration ? "Yes" : "No"}</td></tr>
                            <tr><td className="font-semibold">Your Role: </td><td className={`px-3 py-1 rounded ${userRole ? "bg-cyan-100 text-cyan-800" : "bg-gray-200 text-gray-600"}`}>{userRole || "Visitor"} {hasVoted && userRole === "voter" && "(Voted)"} {isAdmin ? "& Administrator" : ""}</td></tr>
                            </tbody>
                        </table>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Progress:</h3>
                            <div className="flex items-center gap-4">
                                {STATE_MAP.map((label, index) => (
                                    (hasRegistrationState || index !== 1) && (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full ${currentState === index ? "bg-blue-600" : "bg-gray-300"}`}></div>
                                            <span className="text-sm text-gray-600">{label}</span>
                                            {index < STATE_MAP.length - 1 && <div className="w-10 h-1 bg-gray-300" />}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {voteInfo.state !== 3n && (
                            <div>
                                { canVote ? (
                                    <h3 className="text-lg font-semibold mb-2 mt-4">Vote Now:</h3>
                                ) : (
                                    <h3 className="text-lg font-semibold mb-2 mt-4">Options:</h3>
                                )}
                                {options.length === 0 && <div className="text-gray-500 text-sm">Currently no option available.</div>}
                                {options.map(opt => (
                                    <button
                                        key={opt.id}
                                        className={parseInt(opt.id) === parseInt(userOption) ?
                                            "block mb-2 px-4 py-2 border rounded w-full text-left text-green-600 bg-green-100" :
                                            "block mb-2 px-4 py-2 border rounded w-full text-left over:bg-gray-100"}
                                        onClick={canVote ? () => handleVote(opt.id) : null}
                                    >
                                        {voteInfo.optionType === 1n ? opt.rawText : `Candidate: ${opt.candidate}`} {parseInt(opt.id) === parseInt(userOption) ? "(Your Vote)" : ""}
                                    </button>
                                ))}
                            </div>
                        )}

                        {(voteInfo.state === 3n || isAdmin) && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 mt-4">Vote Results:</h3>
                                {options.length === 0 && <div className="text-gray-500 text-sm">Currently no result available.</div>}
                                {options.map(opt => {
                                    const count = voteCounts[opt.id] || 0;
                                    const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                                    return (
                                        <div key={opt.id} className="mb-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{voteInfo.optionType === 1n ? opt.rawText : `Candidate: ${opt.candidate}`} {opt.id === userOption ? "(Your Vote)" : ""}</span>
                                                <span>{count} votes ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-4 rounded">
                                                <div className="bg-blue-500 h-4 rounded" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {voteInfo.optionType === 0n && voteInfo.state === 1n && userRole === "" && (
                            <button onClick={handleRegisterCandidate} className="mt-4 px-4 py-2 bg-purple-600 rounded">
                                Register as Candidate
                            </button>
                        )}

                        {hasRegistrationState && voteInfo.state === 1n && userRole === "" && (
                            <button onClick={handleRegisterVoter} className="mt-4 px-4 py-2 bg-purple-600 rounded">
                                Register as Voter
                            </button>
                        )}

                        {isAdmin && currentState < 3 && (
                            <button onClick={handleNextState} className="mt-6 px-4 py-2 rounded">
                                Advance to Next State
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

