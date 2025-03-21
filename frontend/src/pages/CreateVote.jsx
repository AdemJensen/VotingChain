import { useEffect, useState } from "react";
import Web3 from "web3";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import VotingJson from "../artifacts/contracts_Voting_sol_Voting.json"; // 路径根据你项目结构调整
import VotingNFTJson from "../artifacts/contracts_VotingNFT_sol_VotingNFT.json"; // 路径根据你项目结构调整
import {attachTokenForCurrentUser, getCurrentUser, getCurrentUserInfo, normalizeHex0x} from "../utils/token";
import {API_BASE_URL, getVotingNftAddr} from "../utils/backend.js";

export default function CreateVote() {
    const [web3, setWeb3] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [optionType, setOptionType] = useState("RawText");
    const [needRegistration, setNeedRegistration] = useState(false);
    const [rawOptions, setRawOptions] = useState([""]);
    const [contractAddress, setContractAddress] = useState("");
    const [deploying, setDeploying] = useState(false);

    useEffect(() => {
        const loadUserInfo = async () => {
            setUserInfo(await getCurrentUserInfo());
        };
        loadUserInfo();

        if (window.ethereum) {
            setWeb3(new Web3(window.ethereum));
        } else {
            alert("请安装 MetaMask 扩展");
        }
    }, []);

    const updateRawOption = (index, value) => {
        const updated = [...rawOptions];
        updated[index] = value;
        setRawOptions(updated);
    };

    const addOption = () => setRawOptions([...rawOptions, ""]);

    const removeOption = (index) => {
        const updated = rawOptions.filter((_, i) => i !== index);
        setRawOptions(updated);
    };

    const handleCreateVote = async () => {
        if (!web3) return alert("Web3 Not Ready");

        try {
            setDeploying(true);
            const votingNftAddress = await getVotingNftAddr();

            const from = normalizeHex0x(getCurrentUser());
            const Contract = new web3.eth.Contract(VotingJson.abi);

            const deployTx = Contract.deploy({
                data: VotingJson.bytecode,
                arguments: [
                    votingNftAddress,
                    title,
                    description,
                    optionType === "RawText" ? 1 : 0,
                    needRegistration,
                    rawOptions
                ],
            });

            const gas = await deployTx.estimateGas({ from: from });

            const votingInstance = await deployTx.send({
                from,
                gas,
            });

            const votingAddress = votingInstance.options.address;

            // Call VotingNFT.addMinter(votingAddress)
            const votingNFT = new web3.eth.Contract(VotingNFTJson.abi, votingNftAddress);
            const tx = await votingNFT.methods.addMinter(votingAddress.toString()).send({ from });

            console.log("✅ addMinter success:", tx);

            const response = await fetch(API_BASE_URL + "/votes/create", {
                method: "POST",
                headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    vote_address: votingAddress.toString(),
                })
            });
            const res = await response.json();
            if (!response.ok) {
                alert("❌ Failed to build add admin to db: " + res.error);
                return;
            }

            setContractAddress(votingAddress);
            alert("✅ Voting contract deployed and granted successfully!");
        } catch (err) {
            console.error(err);
            alert("❌ Contract deployment failed：" + err.message);
        } finally {
            setDeploying(false);
        }
    };

    if (!userInfo) return <div>Loading...</div>;

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 text-gray-800">
            <TopNav />
            <div className="flex flex-1">
                <Sidebar role={userInfo?.role} currentPanel="Create Vote" className="w-1/5 bg-gray-100" />

                <main className="flex-1 p-10 overflow-y-auto">
                    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-6">🗳️ Create a New Vote</h2>
                        <p className="text-gray-500 mb-8">
                            Fill in the details below to deploy a new voting contract. Once deployed, a unique voting address will be generated.
                        </p>

                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vote Title</label>
                                <input
                                    className="w-full p-3 border rounded-xl shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                                    placeholder="e.g. Class President Election 2025"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                                    placeholder="Describe the purpose and context of the vote"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Option Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Option Type</label>
                                <select
                                    className="w-full p-3 border rounded-xl bg-white shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                                    value={optionType}
                                    onChange={(e) => setOptionType(e.target.value)}
                                >
                                    <option value="Candidate">Candidate Registration</option>
                                    <option value="RawText">Predefined Text Options</option>
                                </select>
                                <p className="text-sm text-gray-500 mt-1">
                                    If you choose “Candidate Registration”, users will need to register as candidates.
                                </p>
                            </div>

                            {/* Need Registration */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={needRegistration}
                                    onChange={() => setNeedRegistration(!needRegistration)}
                                />
                                <label className="text-sm text-gray-700">Require voter registration before voting</label>
                            </div>

                            {/* RawText Options */}
                            {optionType === "RawText" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Options</label>
                                    <p className="text-sm text-gray-500 mb-2">Each input field below represents one voting option.</p>
                                    {rawOptions.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-2 mb-2">
                                            <input
                                                className="flex-1 p-3 border rounded-xl shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                                                placeholder={`Option ${index + 1}`}
                                                value={option}
                                                onChange={(e) => updateRawOption(index, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeOption(index)}
                                                className="text-sm text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="text-sm text-blue-600 hover:underline mt-2"
                                    >
                                        ➕ Add Option
                                    </button>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="pt-4">
                                <button
                                    className="w-full py-3 px-6 hover:bg-blue-700 text-lg font-semibold rounded-xl shadow-md disabled:opacity-50"
                                    onClick={handleCreateVote}
                                    disabled={deploying}
                                >
                                    {deploying ? "Deploying..." : "🚀 Deploy Voting Contract"}
                                </button>
                            </div>

                            {/* Deployment Result */}
                            {contractAddress && (
                                <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-xl shadow-sm">
                                    <h3 className="font-bold text-green-800 mb-2">✅ Successfully Deployed</h3>
                                    <p className="break-all font-mono text-green-700">{contractAddress}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}