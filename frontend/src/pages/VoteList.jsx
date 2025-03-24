import {useEffect, useState} from "react";
import Web3 from "web3";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import VotingJson from "../artifacts/Voting_sol_Voting.json";
import VotingNFTJson from "../artifacts/VotingNFT_sol_VotingNFT.json";
import {getManagerAddr, getVotingNftAddr} from "../utils/backend.js";
import {getCurrentUser, getCurrentUserInfo, normalizeHex0x} from "../utils/token.js";
import {useParams} from "react-router-dom";
import {useToast} from "../context/ToastContext";
import Manager from "../artifacts/Manager_sol_Manager.json";

const PAGE_SIZE = 5;

const STATE_MAP = {
    0n: "Init",
    1n: "Registration",
    2n: "Voting",
    3n: "Ended"
};

const TITLE_MAP = {
    "full": "All Votes",
    "mine": "Participated Votes",
    "managed": "Managed Votes",
}

const API_MAP = {
    "full": "/votes/page",
    "mine": "/votes/mine",
    "managed": "/votes/page",
}

const getPanelStateColor = (state) => {
    switch (state) {
        case "Init":
            return ` bg-yellow-600 text-white `;
        case "Registration":
            return ` bg-blue-600 text-white `;
        case "Voting":
            return ` bg-green-600 text-white `;
        case "Ended":
            return ` bg-red-600 text-white `;
    }
}

export default function VoteList( {mode} ) {
    const toast = useToast();
    const { pg } = useParams();
    const [votingNftAddr, setVotingNftAddr] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [votes, setVotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const loadUserInfo = async () => {
            setUserInfo(await getCurrentUserInfo());
        };
        loadUserInfo();

        if (window.ethereum) {
            setWeb3(new Web3(window.ethereum));
        } else {
            toast("Please install MetaMask", "error");
        }
    }, []);

    useEffect(() => {
        const t = async () => {
            setVotingNftAddr(getVotingNftAddr());
        }
        t()
    }, []);

    const fetchVoteContracts = async () => {
        setLoading(true);
        try {
            const web3 = new Web3(window.ethereum)
            const Contract = new web3.eth.Contract(Manager.abi, getManagerAddr());
            let data;
            switch (mode) {
                case "full":
                    data = await Contract.methods.pageQueryVotes(page, PAGE_SIZE).call();
                    break;
                case "mine":
                    data = await Contract.methods.pageQueryUserParticipatedVotes(getCurrentUser(), page, PAGE_SIZE).call();
                    break;
                case "managed":
                    data = await Contract.methods.pageQueryUserVotes(getCurrentUser(), page, PAGE_SIZE).call();
                    break;
                default:
                    window.location.href = "/404"
            }

            const contractAddresses = data.votes.map(v => normalizeHex0x(v.contractAddr));
            const createTimes = data.votes.map(v => v.create_time);

            const currentUser = getCurrentUser();

            const voteInfos = await Promise.all(contractAddresses.map(getVoteInfo));

            const fullVotes = await Promise.all(voteInfos.map(async (vote, i) => {
                if (!vote) return null;

                const contractAddr = contractAddresses[i];
                const createdAt = new Date(createTimes[i] * 1000).toISOString().split("T")[0];

                const userInfo = await getUserParticipationInfo(currentUser, contractAddr);
                console.log(vote);
                return {
                    id: data.votes[i].id,
                    contract: contractAddr,
                    createdAt,
                    title: vote.title,
                    state: STATE_MAP[vote.state],
                    optionType: vote.optionType === 1n ? "Predefined Text Options" : "Candidate Registration Mode",
                    needRegistration: vote.needRegistration,
                    candidateNeedApproval: vote.candidateNeedApproval,
                    isAdmin: normalizeHex0x(vote.admin) === normalizeHex0x(currentUser),
                    userRole: userInfo.role,
                    hasVoted: userInfo.voted
                };
            }));

            setVotes(fullVotes.filter(v => v !== null));
            setTotalPages(data.total_pages);
        } catch (err) {
            console.error("Failed to fetch vote contracts:", err);
        } finally {
            setLoading(false);
        }
    };

    const getVoteInfo = async (address) => {
        try {
            const contract = new web3.eth.Contract(VotingJson.abi, address);
            return await contract.methods.getVote().call();
        } catch (err) {
            console.warn(`Failed to get vote info from ${address}:`, err);
            return null;
        }
    };

    const getUserParticipationInfo = async (userAddr, votingAddr) => {
        try {
            const votingNFT = new web3.eth.Contract(VotingNFTJson.abi, votingNftAddr);

            const [role, optionId] = await Promise.all([
                votingNFT.methods.getUserRoleInVoting(userAddr, votingAddr).call(),
                votingNFT.methods.getUserOptionInVoting(userAddr, votingAddr).call()
            ]);

            return {
                role, // "voter" / "candidate" / ""
                voted: optionId !== 0n
            };
        } catch (err) {
            console.warn("getUserParticipationInfo error:", err);
            return { role: "", voted: false };
        }
    };

    const goToPage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    useEffect(() => {
        if (web3 && votingNftAddr) {
            if (pg) {
                setPage(parseInt(pg));
            }
            fetchVoteContracts();
        }
    }, [page, web3, votingNftAddr]);

    if (!web3 || !votingNftAddr || !userInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 text-gray-800">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar role={userInfo?.role} currentPanel={TITLE_MAP[mode]} className="w-1/5 bg-gray-100" />

                <main className="flex-1 overflow-y-auto p-8 bg-white rounded-lg shadow-lg mx-8 my-6">
                    <h2 className="text-3xl font-extrabold mb-6">📋 {TITLE_MAP[mode]}</h2>

                    {loading ? (
                        <div className="text-gray-500">Loading votes...</div>
                    ) : votes.length === 0 ? (
                        <div className="text-gray-400">No votes found.</div>
                    ) : (
                        <div className="space-y-4">
                            {votes.map((vote) => (
                                <div key={vote.id} className="bg-gray-100 rounded-xl p-4 shadow-md hover:shadow-lg transition" style={{"cursor": "pointer"}} onClick={() => {
                                    window.location.href = `/vote/${vote.contract}`;
                                }}>
                                    <div>
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-xl font-bold mb-1">{vote.title}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {vote.contract}, created at {vote.createdAt}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    <span className={"px-3 py-1 text-sm rounded-full mt-3" + getPanelStateColor(vote.state)}>
                                                        {vote.state}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    {vote.optionType  && (
                                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                                                            {vote.optionType}
                                                        </span>
                                                    )}
                                                    {vote.needRegistration && (
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                                                            Voter Registration Required
                                                        </span>
                                                    )}
                                                    {vote.candidateNeedApproval && (
                                                        <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                                                            Candidate Approval Required
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    <div className="flex flex-wrap gap-2 justify-end">
                                                        {vote.isAdmin && (
                                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                                                Admin
                                                            </span>
                                                        )}
                                                        {vote.userRole === "voter" && (
                                                            <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full">
                                                                Voter {vote.hasVoted ? "(Voted)" : "(Not Voted)"}
                                                            </span>
                                                        )}
                                                        {vote.userRole === "candidate" && (
                                                            <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                                                                Candidate
                                                            </span>
                                                        )}
                                                        {vote.userRole === "pending_candidate" && (
                                                            <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                                                                Candidate {vote.state === "Registration" ? "(Pending)" : "(Not Approved)"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-center mt-8 space-x-2">
                        <button
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            onClick={() => goToPage(page - 1)}
                            disabled={page === 1}
                        >
                            Prev
                        </button>
                        <span className="px-4 py-2">{page} / {totalPages}</span>
                        <button
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            onClick={() => goToPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}