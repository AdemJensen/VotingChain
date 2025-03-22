import React, { useState } from "react";
import { API_BASE_URL } from "../utils/backend.js";
import {
    normalizeHex0x,
} from "../utils/token.js";
import { restoreHref } from "../utils/nav.js";
import {executeBackendBuiltTx} from "../utils/contracts.js";
import {useToast} from "../context/ToastContext.jsx";
import Web3 from "web3";

const Init = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState("");
    const [linkedUsersInfo, setLinkedUsersInfo] = useState([]);
    const [done, setDone] = useState(false);

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

    const doInit = async () => {
        if (loggedInUser === "") {
            toast("Please connect MetaMask", "error")
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/init-build`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: loggedInUser
                })
            });

            const data = await response.json();
            if (!response.ok) {
                toast(`Error: init-build error: ${data.error}`, "error");
                setLoading(false);
                return;
            }

            // console.log(data.tx);
            const txHash = await executeBackendBuiltTx(loggedInUser, data.tx);
            const response2 = await fetch(`${API_BASE_URL}/init-exec`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: loggedInUser,
                    tx_hash: txHash
                })
            });

            const data2 = await response2.json();
            if (response2.ok) {
                toast("Success! You can enjoy the system now.", "success");
                setDone(true)
            } else {
                toast(`Error: init-exec error: ${data2.error}`, "error");
            }
        } catch (error) {
            toast(`Error: try-catch err: ${error.message}`, "error");
            console.log(error);
        }

        setLoading(false);
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-100 z-50 overflow-auto p-4">
            <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-xl w-[700px] text-center">
                <h1 className="text-3xl font-bold mb-2 text-black">System Initialization</h1>
                <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Congratulations, the voting system has been successfully deployed!
                </p>
                <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Now, you need to link your Ethereum account to the system to create a root user in the system. This process will setup the database tables and deploy the main NFT contract.
                </p>

                <button
                    onClick={connectMetaMask}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
                >
                    Refresh Wallets
                </button>

                {Object.keys(linkedUsersInfo).length > 0 && (
                    <p className="text-gray-600 text-sm w-full text-left mb-2">
                        You have linked the following wallets, choose one to continue:
                    </p>
                )}

                {/*from linkedUsersInfo (string list) build buttons*/}
                {Object.values(linkedUsersInfo).map((wallet) => (
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

                {loggedInUser !== "" && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Click the button below to execute the initialization process:
                </p>}

                {loggedInUser !== "" && <button
                    onClick={doInit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
                >
                    Execute Initialization
                </button>}

                {done && <p className="text-gray-600 text-sm w-full text-left mb-4">
                    Great, now you can enjoy the system!
                </p>}

                {done && <button
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