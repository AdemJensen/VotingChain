import React, { useState } from "react";
import {getManagerAddr, setNetwork} from "../utils/backend.js";
import {
    normalizeHex0x,
} from "../utils/token.js";
import { restoreHref } from "../utils/nav.js";
import {useToast} from "../context/ToastContext.jsx";
import Web3 from "web3";
import Manager from "../artifacts/Manager_sol_Manager.json";
import Nft from "../artifacts/VotingNFT_sol_VotingNFT.json";

const Init = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState("");
    const [newManagerAddr, setNewManagerAddr] = useState("");
    const [loggedInUser, setLoggedInUser] = useState("");
    const [linkedUsersInfo, setLinkedUsersInfo] = useState([]);
    const [newRootEmail, setNewRootEmail] = useState("root@fake.email");
    const [newRootNickname, setNewRootNickname] = useState("root");

    const [deployManagerState, setDeployManagerState] = useState(0);
    const [deployNftState, setDeployNftState] = useState(0);
    const [grantManagerState, setGrantManagerState] = useState(0);

    const connectMetaMask = async () => {
        if (window.ethereum) {
            try {
                const web3 = new Web3(window.ethereum);
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3.eth.getAccounts();
                console.log("accounts", accounts);
                setLinkedUsersInfo(accounts);
            } catch (error) {
                toast(`Error: eth.getAccounts err: ${error.message}`, "error");
            }
        } else {
            toast(`Please install MetaMask`, "error");
        }
    };

    const handleJoin = async () => {
        try {
            await setNetwork(newManagerAddr);
            toast("Successfully joined the network!", "success");
        } catch (e) {
            toast("Error: " + e.message, "error");
        }
    }

    const handleDeploy = async () => {
        setDeployManagerState(0);
        setDeployNftState(0);
        setGrantManagerState(0);

        if (loggedInUser === "") {
            toast("Please connect MetaMask", "error")
            return;
        }

        setLoading(true);
        const web3 = new Web3(window.ethereum);
        let managerAddress = "";
        let nftAddress = "";
        const from = normalizeHex0x(loggedInUser);
        try {
            // deploy Manager contract
            setDeployManagerState(1);
            const ManagerContract = new web3.eth.Contract(Manager.abi);
            const deployManagerTx = ManagerContract.deploy({
                data: Manager.bytecode,
                arguments: [
                    newRootEmail,
                    newRootNickname,
                ],
            });
            const gas = await deployManagerTx.estimateGas({ from: from });
            const managerInstance = await deployManagerTx.send({
                from,
                gas,
            });
            managerAddress = managerInstance.options.address;
            setDeployManagerState(2);
        } catch (error) {
            setDeployManagerState(-1);
            toast(`Error: try-catch err: ${error.message}`, "error");
            console.log(error);
            setLoading(false);
            return;
        }

        try {
            // deploy Voting NFT Contract
            setDeployNftState(1);
            const NftContract = new web3.eth.Contract(Nft.abi);
            const deployNftTx = NftContract.deploy({
                data: Nft.bytecode,
                arguments: [
                    managerAddress,
                ],
            });
            const gas = await deployNftTx.estimateGas({ from: from });
            const nftInstance = await deployNftTx.send({
                from,
                gas,
            });
            nftAddress = nftInstance.options.address;
            setDeployNftState(2);
        } catch (error) {
            setDeployNftState(-1);
            toast(`Error: try-catch err: ${error.message}`, "error");
            console.log(error);
            setLoading(false);
            return;
        }

        try {
            // grant manager access
            setGrantManagerState(1);
            const web3 = new Web3(window.ethereum)
            const ManagerInstance = new web3.eth.Contract(Manager.abi, managerAddress);
            await ManagerInstance.methods.setNFTAddr(nftAddress).send({ from: from });
            setGrantManagerState(2);
            toast("Successfully deployed the network!", "success");

            // set current network
            await setNetwork(managerAddress);
            toast("Successfully set current network to " + managerAddress, "success");
            setCurrentStep("done");
        } catch (error) {
            setGrantManagerState(-1);
            toast(`Error: try-catch err: ${error.message}`, "error");
            console.log(error);
            setLoading(false);
            return;
        }

        setLoading(false);
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-100 z-50 overflow-auto p-4">
            <div className="flex flex-col p-8 bg-white rounded-xl shadow-xl w-[700px] text-left">
                <h1 className="text-3xl font-bold mb-2 text-center text-black">Deploy or Join VotingChain Network</h1>
                {currentStep === "" && getManagerAddr() === "" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Congratulations, the voting system has been successfully deployed!
                </p>}
                {currentStep === "" && getManagerAddr() !== "" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    You have joined the following network:
                </p>}
                {currentStep === "" && getManagerAddr() !== "" && <button
                    disabled={true}
                    className="flex mb-2 px-4 py-2 shadow rounded w-full text-left bg-gray-100 hover:bg-gray-200"
                >
                    {normalizeHex0x(getManagerAddr())}
                </button>}
                {currentStep === "" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    You can choose to deploy or join the VotingChain Network:
                </p>}
                {currentStep === "" && <button
                    onClick={() => {setCurrentStep("join")}}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
                >
                    Join an Existing Network
                </button>}
                {currentStep === "" && <button
                    onClick={() => {setCurrentStep("create")}}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
                >
                    Create a New Network
                </button>}
                {currentStep === "" && getManagerAddr() !== "" && <button
                    onClick={restoreHref}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded mb-4"
                >
                    Back
                </button>}


                {currentStep === "join" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    To join a network, please enter the network contract address:
                </p>}
                {currentStep === "join" && <label className="block font-semibold text-left mb-1">Network Contract Address</label>}
                {currentStep === "join" && <input
                    type="text"
                    placeholder="Enter Network Contract Address"
                    value={newManagerAddr}
                    onChange={(e) => setNewManagerAddr(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-6"
                />}
                {currentStep === "join" && <button
                    onClick={handleJoin}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
                >
                    {loading ? "Processing..." : "Join Network"}
                </button>}


                {currentStep === "create" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    To create a new network, you need to connect your MetaMask wallet. Please click "Refresh Wallets" button to collect the linked accounts.
                </p>}
                {currentStep === "create" && <button
                    onClick={connectMetaMask}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
                >
                    Refresh Wallets
                </button>}
                {currentStep === "create" && Object.keys(linkedUsersInfo).length > 0 && (
                    <p className="text-gray-600 text-sm w-full text-left mb-2">
                        You have linked the following wallets, choose one to continue:
                    </p>
                )}
                {currentStep === "create" && Object.values(linkedUsersInfo).map((wallet) => (
                    <button
                        onClick={() => {setLoggedInUser(wallet)}}
                        disabled={loading}
                        className={wallet === loggedInUser ?
                            "flex mb-2 px-4 py-2 shadow rounded w-full text-left text-green-600 bg-green-100" :
                            "flex mb-2 px-4 py-2 shadow rounded w-full text-left bg-gray-100 hover:bg-gray-200"}
                        style={{"cursor": "pointer"}}
                    >
                        {normalizeHex0x(wallet)}
                    </button>
                ))}
                {currentStep === "create" && loggedInUser !== ""  && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Great, now enter your desired root user's email and nickname, note that email is not modifiable after deployment:
                </p>}
                {currentStep === "create" && loggedInUser !== ""  && <label className="block font-semibold text-left mb-1">Email</label>}
                {currentStep === "create" && loggedInUser !== ""  && <input
                    type="text"
                    placeholder="Enter email"
                    value={newRootEmail}
                    onChange={(e) => setNewRootEmail(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-6"
                />}
                {currentStep === "create" && loggedInUser !== ""  && <label className="block font-semibold text-left mb-1">Nickname</label>}
                {currentStep === "create" && loggedInUser !== ""  && <input
                    type="text"
                    placeholder="Enter nickname"
                    value={newRootNickname}
                    onChange={(e) => setNewRootNickname(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-6"
                />}
                {currentStep === "create" && loggedInUser !== "" && newRootEmail !== "" && newRootNickname !== "" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Click the button below to deploy the network using your wallet:
                </p>}
                {currentStep === "create" && loggedInUser !== "" && newRootEmail !== "" && newRootNickname !== "" && <button
                    disabled={loading}
                    onClick={handleDeploy}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
                >
                    {loading ? "Processing..." : "Deploy Network"}
                </button>}
                {currentStep === "create" && deployManagerState !== 0 && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Deploy Manager contract...{deployManagerState > 1 && "OK"}{deployManagerState < 0 && "Error"}
                </p>}
                {currentStep === "create" && deployNftState !== 0 && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Deploy NFT contract...{deployNftState > 1 && "OK"}{deployNftState < 0 && "Error"}
                </p>}
                {currentStep === "create" && grantManagerState !== 0 && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Granting Manager Access...{grantManagerState > 1 && "OK"}{grantManagerState < 0 && "Error"}
                </p>}


                {(currentStep === "create" || currentStep === "join") && <button
                    disabled={loading}
                    onClick={() => {setCurrentStep("")}}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded mb-4"
                >
                    Back
                </button>}


                {currentStep === "done" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Congratulations! You are all set! Click the button below to go to the main page.
                </p>}
                {currentStep === "done" && <button
                    onClick={restoreHref}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded mb-4"
                >
                    Go to Main Page
                </button>}
            </div>
        </div>
    );
};

export default Init;