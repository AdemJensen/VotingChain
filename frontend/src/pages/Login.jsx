import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { API_BASE_URL } from "../utils/backend.js";
import {
    setTokenFor,
    setCurrentUser,
    batchGetUserInfoFromWeb3,
    normalizeHex0x,
    getUserInfo,
    getGravatarAddress,
    getCurrentUserInfo,
    getCurrentUser,
} from "../utils/token.js";
import { getHref } from "../utils/nav.js";

const getRoleBadge = (role) => {
    switch (role) {
        case "admin":
            return (
                <span className="px-3 py-1 ml-3 bg-pink-600 text-white text-xs rounded-full">
                    Admin
                </span>
            );
        case "root":
            return (
                <span className="px-3 py-1 ml-3 bg-purple-600 text-white text-xs rounded-full">
                    Root
                </span>
            );
        case "user":
            return (
                <span className="px-3 py-1 ml-3 bg-sky-600 text-white text-xs rounded-full">
                    User
                </span>
            );
        default:
            return (
                <span className="px-3 py-1 ml-3 bg-yellow-600 text-white text-xs rounded-full">
                    Not Registered
                </span>
            );
    }
}

const Login = ({ title }) => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [btnText, setbtnText] = useState("Refresh Wallets");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [jumpToLocation, setJumpToLocation] = useState("");
    const [linkedUsersInfo, setLinkedUsersInfo] = useState({});
    const [message, setMessage] = useState("");

    const linkWallet = async () => {
        const usersInfo = await batchGetUserInfoFromWeb3();
        setLinkedUsersInfo(usersInfo);
    };

    useEffect(() => {
        linkWallet();
        const fetchUserInfo = async () => {
            const user = await getCurrentUserInfo();
            setLoggedInUser(user);
        };
        fetchUserInfo();
    }, []);

    const displayCurrentUser = () => {
        if (!loggedInUser || loggedInUser.wallet_address === "") return null;

        return (
            <button className="flex mb-2 px-4 py-2 shadow rounded w-full text-left text-green-600 bg-green-100">
                <img
                    src={getGravatarAddress(loggedInUser.email, 40)}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full mr-3"
                />
                <label className={"ml-4"}>
                    {loggedInUser.nickname === "" ? '-' : loggedInUser.nickname}
                    <div className="text-xs text-gray-500">{normalizeHex0x(loggedInUser.wallet_address)}</div>
                </label>
                <div className="flex items-center gap-2">
                    {getRoleBadge(loggedInUser.role)}
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                        Current User
                    </span>
                </div>
            </button>
        );
    };

    const jump = () => {
        window.location.href = jumpToLocation;
    };

    const uponValidationSuccess = (u, msg, bt, href) => {
        setMessage(`✅ ${msg} Redirecting in 3 seconds...`);
        setDone(true);
        setLoading(false);
        setLinkedUsersInfo({});
        setCurrentUser(u.wallet_address);
        setbtnText(bt);
        setLoggedInUser(u);
        if (href === "") href = getHref();
        setJumpToLocation(href);

        // 自动跳转
        setTimeout(() => {
            window.location.href = href;
        }, 3000);
    };

    const login = async (account) => {
        account = normalizeHex0x(account);
        setLoading(true);
        setMessage("");

        try {
            const userInfo = await getUserInfo(account);
            switch (userInfo.state) {
                case "registered":
                    return uponValidationSuccess(userInfo, "Already logged in!", "Continue", "");
                case "verified":
                    return uponValidationSuccess(userInfo, "Wallet verified, user not registered.", "Proceed to Register", "/register");
            }

            const web3 = new Web3(window.ethereum);
            const response = await fetch(`${API_BASE_URL}/auth/gen`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet_address: account }),
            });

            const data = await response.json();
            if (!response.ok) {
                setMessage(`❌ Error: ${data.error}`);
                setLoading(false);
                return;
            }

            const signature = await web3.eth.personal.sign(data.challenge, account, "");
            const response2 = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: account,
                    signature: signature,
                }),
            });

            if (!response2.ok) {
                setMessage(`❌ Error: ${data.error}`);
                setLoading(false);
                return;
            }

            const data2 = await response2.json();
            const token = data2.token;
            setTokenFor(account, token);
            setCurrentUser(account);
            const info = await getCurrentUserInfo();

            if (info.state === "verified") {
                uponValidationSuccess(userInfo, "Wallet verified, user not registered.", "Proceed to Register", "/register");
            } else {
                uponValidationSuccess(userInfo, "Login Success!", "Continue", "");
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        }

        setLoading(false);
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-100 z-50 overflow-auto p-4">
            <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-xl w-[700px] text-center">
                <h1 className="text-3xl font-bold mb-2 text-black">{title}</h1>
                <p className="text-gray-600 text-sm w-full text-left mb-4">
                    {getCurrentUser() === ""
                        ? "Please Grant Permission to Access Your MetaMask Wallet."
                        : "You have logged in with the following wallet:"}
                </p>

                {displayCurrentUser()}

                <button
                    onClick={done ? jump : linkWallet}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded mb-4"
                >
                    {btnText}
                </button>

                {Object.keys(linkedUsersInfo).length > 0 && (
                    <p className="text-gray-600 text-sm w-full text-left mb-2">
                        You have linked the following wallets, choose one to continue:
                    </p>
                )}

                {Object.entries(linkedUsersInfo).map(([walletAddress, user], index) => (
                    <button
                        key={index}
                        onClick={() => login(walletAddress)}
                        disabled={loading}
                        className={walletAddress === getCurrentUser() ?
                            "flex mb-2 px-4 py-2 shadow rounded w-full text-left text-green-600 bg-green-100" :
                            "flex mb-2 px-4 py-2 shadow rounded w-full text-left bg-gray-100 hover:bg-gray-200"}
                        style={{"cursor": "pointer"}}
                    >
                        <img
                            src={getGravatarAddress(user.email, 40)}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full mr-3"
                        />
                        <label className={"ml-4"}>
                            {user.nickname === "" ? '-' : user.nickname}
                            <div className="text-xs text-gray-500">{normalizeHex0x(walletAddress)}</div>
                        </label>
                        <div className="flex items-center gap-2">
                            {getRoleBadge(user.role)}
                            {user.state === "unverified" ?
                                <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full">
                                    Unverified
                                </span> : walletAddress === getCurrentUser() ?
                                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                                        Current User
                                    </span> :
                                    <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                                        Verified
                                    </span>
                            }
                        </div>
                    </button>
                ))}

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
};

export default Login;