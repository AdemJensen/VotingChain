import { useEffect, useState } from "react";
import Web3 from "web3";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import VotingJson from "../artifacts/contracts_Voting_sol_Voting.json";
import VotingNFTJson from "../artifacts/contracts_VotingNFT_sol_VotingNFT.json";
import {API_BASE_URL, getVotingNftAddr} from "../utils/backend.js";
import {attachTokenForCurrentUser, getCurrentUser, getCurrentUserInfo, normalizeHex0x} from "../utils/token.js";

const PAGE_SIZE = 10;

const STATE_MAP = {
    0n: "Init",
    1n: "Registration",
    2n: "Voting",
    3n: "Ended"
};

export default function VoteList( {mine} ) {
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
            alert("Please install MetaMask");
        }
    }, []);

    useEffect(() => {
        const t = async () => {
            setVotingNftAddr(await getVotingNftAddr());
        }
        t()
    }, []);

    const fetchVoteContracts = async () => {
        setLoading(true);
        try {
            // console.log("Mine:", mine)
            const pageQueryResp = await fetch(API_BASE_URL + (mine ? "/votes/mine" : "/votes/page"), {
                method: "POST",
                headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
                body: JSON.stringify({ page: page, page_size: PAGE_SIZE })
            });
            const data = await pageQueryResp.json();
            if (!pageQueryResp.ok) {
                alert(`❌ Failed to fetch votes on page ${page}: ` + data.error);
                return;
            }

            const contractAddresses = data.votes.map(v => normalizeHex0x(v.contract_address));
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
            const vote = await contract.methods.getVote().call();
            return vote;
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
            fetchVoteContracts();
        }
    }, [page, web3, votingNftAddr]);

    if (!web3 || !votingNftAddr || !userInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 text-gray-800">
            <TopNav />
            <div className="flex flex-1">
                <Sidebar role={userInfo?.role} currentPanel={mine ? "My Records" : "Voting List"} className="w-1/5 bg-gray-100" />

                <main className="flex-1 p-8 bg-white rounded-lg shadow-lg mx-8 my-6">
                    <h2 className="text-3xl font-extrabold mb-6">📋 Voting List</h2>

                    {loading ? (
                        <div className="text-gray-500">Loading votes...</div>
                    ) : votes.length === 0 ? (
                        <div className="text-gray-400">No votes found.</div>
                    ) : (
                        <div className="space-y-4">
                            {votes.map((vote) => (
                                <div key={vote.id} className="bg-gray-30 rounded-xl p-4 shadow-md hover:shadow-lg transition" onClick={() => {
                                    window.location.href = `/vote/${vote.contract}`;
                                }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold mb-1">{vote.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {vote.contract}, created at {vote.createdAt}
                                            </p>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                                              {vote.optionType}
                                            </span>
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                                              {vote.needRegistration ? "Voter Registration Required" : "No Voter Registration"}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                              {vote.state}
                                            </span>

                                            {vote.isAdmin && (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                            You are Admin
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