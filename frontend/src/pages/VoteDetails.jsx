import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import Web3 from "web3";
import VotingJson from "../artifacts/Voting_sol_Voting.json";
import VotingNFTJson from "../artifacts/VotingNFT_sol_VotingNFT.json";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import {
    getCurrentUser,
    getCurrentUserInfo,
    getGravatarAddress,
    getUserInfo,
    hexEqual, isEmptyHex,
    normalizeHex0x
} from "../utils/token";
import {getVotingNftAddr} from "../utils/backend";
import { useToast } from "../context/ToastContext";

const STATE_MAP = ["Init", "Registration", "Voting", "Ended"];
const OPTION_TYPE_MAP = {
    0: "Candidate Registration Mode",
    1: "Predefined Text Options"
};

export default function VoteDetails() {
    const toast = useToast();
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
    const [pendingCandidates, setPendingCandidates] = useState([]);
    const [userOption, setUserOption] = useState(0n);
    const [voteCounts, setVoteCounts] = useState({});
    const [candidateInfoLookup, setCandidateInfoLookup] = useState(null);
    const [prepDone, setPrepDone] = useState(false);

    useEffect(() => {
        if (window.ethereum) {
            setWeb3(new Web3(window.ethereum));
        } else {
            toast("Please install MetaMask", "error");
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
            const votingNFT = new web3.eth.Contract(VotingNFTJson.abi, getVotingNftAddr());
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
            const pendingCandidates = [];
            const candidateInfo = {};
            for (const i in allTokens) {
                const t = allTokens[i];
                // console.log("token:", t)
                switch (t.metadata.role) {
                    case "pending_candidate":
                        // add to pending candidates
                        candidateInfo[t.owner] = await getUserInfo(t.owner);
                        pendingCandidates.push(t);
                        break;
                    case "voter":
                        if (!voteCounter[t.metadata.option]) voteCounter[t.metadata.option] = 0;
                        voteCounter[t.metadata.option]++;
                        break;
                }
            }
            // console.log("OK8")
            console.log("pendingCandidates:", pendingCandidates);
            setPendingCandidates(pendingCandidates);

            setVoteInfo(vote);
            setIsAdmin(isOwner);
            setUserRole(role);
            const hv = votedOption !== 0n;
            setHasVoted(hv);
            setHasRegistrationState(regState);
            setCurrentState(parseInt(vote.state));
            setOptions(vote.options);
            // for each option, get the candidate info
            for (const opt of vote.options) {
                if (isEmptyHex(opt.candidate)) continue;
                candidateInfo[opt.candidate] = await getUserInfo(opt.candidate);
            }
            setCandidateInfoLookup(candidateInfo);
            // console.log("candidateInfo:", candidateInfo)

            setCanVote(vote.state === 2n && (role === "voter" || role === "" && !vote.needRegistration) && !hv);
            setUserOption(parseInt(userOpt));
            setVoteCounts(voteCounter);
            setPrepDone(true);
        } catch (err) {
            console.error("Failed to load vote details:", err);
            toast("Failed to load vote details: " + err.message, "error");
        }
    };

    const handleRegisterCandidate = async () => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.registerCandidate().send({ from: normalizeHex0x(getCurrentUser()) });
            toast("Candidate registration successful!");
            loadVoteDetails();
        } catch (err) {
            toast("Registration failed: " + err.message, "error");
        }
    };

    const handleRegisterVoter = async () => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.registerVoter().send({ from: normalizeHex0x(getCurrentUser()) });
            toast("Candidate registration successful!");
            loadVoteDetails();
        } catch (err) {
            toast("Registration failed: " + err.message, "error");
        }
    };

    const handleApproveCandidate = async (candidate) => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.approveCandidate(candidate).send({ from: normalizeHex0x(getCurrentUser()) });
            toast("Candidate approved!");
            loadVoteDetails();
        } catch (err) {
            toast("Approve candidate failed: " + err.message, "error");
        }
    };

    const handleVote = async (optionId) => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.doVote(optionId).send({ from: normalizeHex0x(getCurrentUser()) });
            toast("Vote successful!");
            loadVoteDetails();
        } catch (err) {
            toast("Voting failed: " + err.message, "error");
        }
    };

    const handleNextState = async () => {
        try {
            const voting = new web3.eth.Contract(VotingJson.abi, contract);
            await voting.methods.nextState().send({ from: normalizeHex0x(getCurrentUser()) });
            toast("State updated!");
            loadVoteDetails();
        } catch (err) {
            toast("State change failed: " + err.message, "error");
        }
    };

    if (!voteInfo || !user || !prepDone) return <div className="p-10 text-gray-500">Loading vote details...</div>;

    const totalVotes = Object.values(voteCounts).reduce((acc, val) => acc + val, 0);

    // console.log("candidateInfoLookup", candidateInfoLookup);
    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 text-gray-800 overflow-hidden">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    role={user?.role}
                    currentPanel="Vote Details"
                    className="w-1/5 bg-gray-100 overflow-y-auto"
                />

                <main className="flex-1 p-10 overflow-y-auto">
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-6">
                        <h2 className="text-3xl font-extrabold">{voteInfo.title}</h2>
                        <p className="text-gray-700 mb-4 whitespace-pre-line">{voteInfo.description}</p>

                        <table className="w-full text-left text-sm border-t border-gray-200">
                            <tbody>
                            <tr><td className="font-semibold">Contract Address:</td><td className="font-mono break-all bg-gray-100 p-2 rounded">{contract}</td></tr>
                            <tr><td className="font-semibold">Current State:</td><td className="bg-blue-100 text-blue-800 px-3 py-1 rounded">{STATE_MAP[currentState]}</td></tr>
                            <tr><td className="font-semibold">Option Type:</td><td className="bg-purple-100 text-purple-800 px-3 py-1 rounded">{OPTION_TYPE_MAP[voteInfo.optionType]}</td></tr>
                            <tr><td className="font-semibold">Need Candidate Approval:</td><td className={`px-3 py-1 rounded ${voteInfo.candidateNeedApproval ? "bg-pink-100 text-pink-800" : "bg-sky-100 text-sky-800"}`}>{voteInfo.candidateNeedApproval ? "Yes" : "No"}</td></tr>
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

                        <div>
                            { canVote ? (
                                <h3 className="text-lg font-semibold mb-2 mt-4">Vote Now:</h3>
                            ) : (
                                <h3 className="text-lg font-semibold mb-2 mt-4">Options:
                                    <span className="px-3 py-1 ml-3 bg-gray-200 text-gray-400 text-xs rounded-full">
                                        Preview Only
                                    </span>
                                </h3>
                            )}
                            {options.length === 0 && (pendingCandidates.length === 0 || !isAdmin) && <div className="text-gray-500 text-sm">Currently no option available.</div>}
                            {pendingCandidates.map(opt => {
                                if (!isAdmin && !hexEqual(opt.owner, getCurrentUser())) {
                                    console.log("skip candidate:", opt.owner, getCurrentUser());
                                    return null;
                                }
                                return (
                                    <button
                                        className={
                                            "flex mb-2 px-4 py-2 shadow rounded w-full text-left bg-yellow-100 hover:bg-yellow-200"}
                                    >
                                        <img
                                            src={getGravatarAddress(candidateInfoLookup[opt.owner]?.email, 80)}
                                            alt="AVT"
                                            className="w-10 h-10 rounded-full cursor-pointer"
                                        />
                                        <label className={"ml-4"}>
                                            {candidateInfoLookup[opt.owner]?.nickname}
                                            <div className="text-xs text-gray-500">{opt.owner}</div>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {voteInfo.state === 1n ? <span
                                                className="px-3 py-1 ml-3 bg-yellow-600 text-white text-xs rounded-full">
                                                Pending
                                            </span> : <span
                                                className="px-3 py-1 ml-3 bg-red-600 text-white text-xs rounded-full">
                                                Not Approved
                                            </span>}
                                        </div>
                                        {isAdmin && voteInfo.state === 1n && (
                                            <button
                                                className="px-3 py-1 ml-3 bg-blue-600 text-white text-xs rounded"
                                                style={{"marginLeft": "auto"}}
                                                onClick={() => handleApproveCandidate(opt.owner)}
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </button>
                                )}
                            )}
                            {options.map(opt => (
                                <button
                                    key={opt.id}
                                    className={parseInt(opt.id) === parseInt(userOption) ?
                                        "flex mb-2 px-4 py-2 shadow rounded w-full text-left text-green-600 bg-green-100" :
                                        "flex mb-2 px-4 py-2 shadow rounded w-full text-left bg-gray-100 hover:bg-gray-200"}
                                    onClick={canVote ? () => handleVote(opt.id) : null}
                                    style={{"cursor": canVote ? "pointer" : "default"}}
                                    disabled={!canVote}
                                >
                                    {voteInfo.optionType === 0n && (<img
                                        src={getGravatarAddress(candidateInfoLookup[opt.candidate]?.email, 80)}
                                        alt="AVT"
                                        className="w-10 h-10 rounded-full cursor-pointer"
                                    />)}
                                    {voteInfo.optionType === 0n && (<label className={"ml-4"}>
                                        {candidateInfoLookup[opt.candidate]?.nickname}
                                        <div className="text-xs text-gray-500">{opt.candidate}</div>
                                    </label>)}
                                    <div>
                                        {voteInfo.optionType === 1n && opt.rawText}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {parseInt(opt.id) === parseInt(userOption) &&
                                            <span className="px-3 py-1 ml-3 bg-green-600 text-white text-xs rounded-full">
                                                Your Vote
                                            </span>
                                        }
                                    </div>
                                </button>
                            ))}
                        </div>

                        {(voteInfo.state === 3n || isAdmin) && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 mt-4">Vote Results:</h3>
                                {options.length === 0 && <div className="text-gray-500 text-sm">Currently no result available.</div>}
                                {options.map(opt => {
                                    const count = voteCounts[opt.id] || 0;
                                    const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                                    return (
                                        <div key={opt.id} className="mb-3">
                                            <div className={"flex justify-between text-sm mb-1" + (parseInt(opt.id) === parseInt(userOption) ? " text-green-700" : "")}>
                                                <span>{voteInfo.optionType === 1n ? opt.rawText : `${candidateInfoLookup[opt.candidate]?.nickname} (${opt.candidate})`} {parseInt(opt.id) === parseInt(userOption) && (
                                                    <span className="px-3 py-1 ml-3 bg-green-600 text-white text-xs rounded-full">
                                                        Your Vote
                                                    </span>)}
                                                </span>
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
                            <button onClick={handleRegisterCandidate} className="mt-4 mr-12 px-4 py-2 bg-red-400 hover:bg-red-600 text-white rounded">
                                Register as Candidate
                            </button>
                        )}

                        {voteInfo.needRegistration && voteInfo.state === 1n && userRole === "" && (
                            <button onClick={handleRegisterVoter} className="mt-4 mr-12 px-4 py-2 bg-green-600 hover:bg-green-800 text-white rounded">
                                Register as Voter
                            </button>
                        )}

                        {isAdmin && currentState < 3 && (
                            <button onClick={handleNextState} className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded">
                                Advance to Next State
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

