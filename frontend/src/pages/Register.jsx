import React, { useState, useEffect } from "react";
import {
    getCurrentUser,
    getCurrentUserStatus,
    logoutCurrentUser,
} from "../utils/token.js";
import { restoreHref } from "../utils/nav.js";
import Manager from "../artifacts/Manager_sol_Manager.json";
import {getManagerAddr} from "../utils/backend.js";
import Web3 from "web3";

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [userStatus, setUserStatus] = useState("");
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [message, setMessage] = useState("");

    const wallet = getCurrentUser();

    useEffect(() => {
        const fetchUserStatus = async () => {
            const stat = await getCurrentUserStatus();
            setUserStatus(stat);
        };
        fetchUserStatus();
    }, []);

    const jump = () => {
        restoreHref();
    };

    const register = async () => {
        setLoading(true);
        setMessage("");

        try {
            const web3 = new Web3(window.ethereum)
            const ManagerInstance = new web3.eth.Contract(Manager.abi, getManagerAddr());
            await ManagerInstance.methods.addUser(email, nickname).send({ from: getCurrentUser() });

            setMessage("✅ Successfully registered! Redirecting in 3 seconds...");
            setDone(true);

            // ✅ 替换为你的 toast 系统
            // showToast("success", "Successfully registered!");

            setTimeout(() => {
                restoreHref();
            }, 3000);
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
            // showToast("error", error.message);
        }

        setLoading(false);
    };

    const mainRender = () => (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-100 overflow-auto p-4 z-50">
            <div className="flex flex-col p-8 bg-white rounded-xl shadow-xl w-full max-w-xl text-center">
                <h1 className="text-3xl font-bold mb-4 text-black">Register Account</h1>
                <p className="text-gray-600 text-left text-sm mb-6">
                    You have successfully connected your wallet. However, this wallet was not associated to an account in our system. Please register your account to continue.
                </p>

                <label className="block font-semibold text-left mb-1">Wallet Address</label>
                <input
                    type="text"
                    value={"0x" + wallet}
                    readOnly
                    disabled
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                />

                <label className="block font-semibold text-left mb-1">Email Address</label>
                <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                />

                <label className="block font-semibold text-left mb-1">Nickname</label>
                <input
                    type="text"
                    placeholder="Enter nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-6"
                />

                <button
                    onClick={done ? jump : register}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition mb-3 disabled:opacity-50"
                >
                    {loading ? "Processing..." : done ? "Continue" : "Register Account"}
                </button>

                {!done && (
                    <button
                        onClick={() => {
                            logoutCurrentUser();
                            window.location.href = "/login";
                        }}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}

                {message && (
                    <p
                        className={`text-sm mt-4 ${
                            message.startsWith("✅") ? "text-green-600" : "text-red-600"
                        }`}
                    >
                        {message}
                    </p>
                )}
            </div>
        </div>
    );

    switch (userStatus) {
        case "":
            return <div className="text-center py-8 text-gray-500">Fetching user state...</div>;
        case "unverified":
            console.log("Current user is unverified, redirecting to login page...");
            window.location.href = "/login";
            return null;
        case "registered":
            console.log("Current user is registered, redirecting to main page...");
            restoreHref();
            return null;
        default:
            return mainRender();
    }
};

export default Register;