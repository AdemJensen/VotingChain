import React, {useEffect, useState} from "react";
import Web3 from "web3";
import { API_BASE_URL } from "../utils/backend.js";
import {
    setTokenFor,
    setCurrentUser,
    getCurrentUserStatus,
    batchGetUserInfoFromWeb3,
    normalizeHex0x,
    getUserInfo, getGravatarAddress
} from "../utils/token.js";

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [linkedUsersInfo, setLinkedUsersInfo] = useState({});
    const [message, setMessage] = useState("");

    const linkWallet = async () => {
        const usersInfo = await batchGetUserInfoFromWeb3()
        console.log("usersInfo", usersInfo);
        setLinkedUsersInfo(usersInfo)
        console.log("OK");
    }

    useEffect(() => {
        linkWallet();
    }, [])

    const jump = async () => {
        window.location.href = "/"
    }

    const login = async (account) => {
        account = normalizeHex0x(account);
        console.log(account);
        setLoading(true);
        setMessage("");

        try {
            // check if user's token is still valid
            const userInfo = await getUserInfo(account);
            console.log("USER STATE: ", userInfo.state);
            switch (userInfo.state) {
                case "registered":
                    setMessage(`✅ Already logged in! Redirecting in 3 seconds...`);
                    setDone(true);
                    setLoading(false);
                    setLinkedUsersInfo({})
                    setCurrentUser(account);
                    // 3 秒后跳转到主页面
                    setTimeout(() => {
                        window.location.href = "/";
                    }, 3000);
                    return;
                case "verified":
                    setMessage(`✅ Wallet already verified, user not registered. Redirecting in 3 seconds...`);
                    setDone(true);
                    setLoading(false);
                    setLinkedUsersInfo({})
                    setCurrentUser(account);
                    // 3 秒后跳转到注册
                    setTimeout(() => {
                        window.location.href = "/register";
                    }, 3000);
                    return;
            }

            const web3 = new Web3(window.ethereum);

            const response = await fetch(`${API_BASE_URL}/auth/gen`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: account
                })
            });

            const data = await response.json();
            if (!response.ok) {
                setMessage(`❌ Error: ${data.error}`);
                setLoading(false);
                return;
            }

            const signature = await web3.eth.personal.sign(data.challenge, account, '');
            console.log("用户签名:", signature);

            const response2 = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: account,
                    signature: signature
                })
            });

            if (!response2.ok) {
                setMessage(`❌ Error: ${data.error}`);
                setLoading(false);
                return;
            }

            const data2 = await response2.json();
            const token = data2.token;
            console.log("用户 Token:", token);
            setTokenFor(account, token);
            setCurrentUser(account);
            setLinkedUsersInfo({})

            // check if the user is registered
            const stat = await getCurrentUserStatus();
            setDone(true)
            if (stat === "verified") {
                setMessage(`✅ Wallet verified, user not registered. Redirecting in 3 seconds...`);
                // 3 秒后跳转到注册
                setTimeout(() => {
                    window.location.href = "/register";
                }, 3000);
            } else {
                setMessage(`✅ Login Success! Redirecting in 3 seconds...`);
                // 3 秒后跳转到主页面
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        }

        setLoading(false);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.box}>
                <h1 style={styles.title}>Login</h1>
                <p style={styles.text}>
                    Please Grant Permission to Access Your MetaMask Wallet.
                </p>
                <button onClick={done ? jump : linkWallet} disabled={loading} style={styles.buttonPrimary}>
                    {done ? "Back to Home" : "Refresh Wallets"}
                </button>
                {/*if linkedUsersInfo is not empty, display an extra text*/}
                {Object.keys(linkedUsersInfo).length > 0 && (
                    <p style={styles.text}>
                        You have linked the following wallets, choose one to continue:
                    </p>
                )}
                {/*for each user, display a button*/}
                {Object.entries(linkedUsersInfo).map(([walletAddress, user], index) => (
                    <button className="flex items-center" key={index} onClick={() => login(walletAddress)} disabled={loading} style={styles.button}>
                        <img
                            src={getGravatarAddress(user.email, 40)}
                            alt="Avt"
                            className="w-10 h-10 rounded-full cursor-pointer mr-3"
                        />
                        <div>
                            0x{walletAddress.slice(0, 12)}... ({user.nickname === "" ? "⚠️ Not Registered" : "✅ As user " + user.nickname}, {user.state === "unverified" ? "🔴 Unverified" : "🟢 Verified"})
                        </div>
                   </button>
                ))}
                {message && <p style={message.startsWith("✅") ? styles.successMessage : styles.errorMessage}>{message}</p>}
            </div>
        </div>
    );
};

// **✅ 仅在 `Init.js` 内部使用 CSS，不影响其他页面**
const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        zIndex: 1000, // 确保 `Init` 界面始终在最上层
    },
    box: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "30px",
        borderRadius: "10px",
        backgroundColor: "#fff",
        boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)",
        width: "600px",
        textAlign: "center",
    },
    title: {
        fontSize: "36px",
        marginBottom: "10px",
        color: "black",
    },
    text: {
        fontSize: "16px",
        marginBottom: "20px",
        color: "#666",
        textAlign: "left",
        width: "100%",
    },
    button: {
        padding: "10px 20px",
        marginBottom: "10px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        width: "100%",
    },
    buttonPrimary: {
        padding: "10px 20px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        width: "100%",
        marginTop: "10px",
    },
    input: {
        width: "100%",
        padding: "10px",
        borderRadius: "5px",
        border: "1px solid #ddd",
        marginBottom: "10px",
        fontSize: "16px",
    },
    successMessage: {
        color: "green",
        fontSize: "14px",
        marginTop: "10px",
    },
    errorMessage: {
        color: "red",
        fontSize: "14px",
        marginTop: "10px",
    },
};

export default Login;