import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/backend.js";
import {attachTokenForCurrentUser, getCurrentUser, getCurrentUserStatus, logoutCurrentUser} from "../utils/token.js";

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [userStatus, setUserStatus] = useState("");
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [message, setMessage] = useState("");

    const wallet = getCurrentUser();
    useEffect(() => {
        console.log("Triggered");
        const fetchUserStatus = async () => {
            console.log("Fetched");
            const stat = await getCurrentUserStatus();
            setUserStatus(stat);
        };
        fetchUserStatus();
    }, []);

    const jump = () => {
        window.location.href = "/";
    }

    const register = async () => {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    email: email,
                    nickname: nickname
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(`✅ Successfully registered! Redirecting in 3 seconds...`);
                setDone(true);
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            } else {
                setMessage(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        }

        setLoading(false);
    };

    const mainRender = () => (
        <div style={styles.overlay}>
            <div style={styles.box}>
                <h1 style={styles.title}>Register Account</h1>
                <p style={styles.text}>
                    You have successfully connected your wallet. However, this wallet was not associated to an account in our system. Please register your account to continue.
                </p>
                <label className="block font-semibold mb-1" style={{textAlign: "left"}}>Wallet Address</label>
                <input
                    type="text"
                    value={"0x"+wallet}
                    readOnly
                    disabled
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                />
                <label className="block font-semibold mb-1" style={{textAlign: "left"}}>Email Address</label>
                <input
                    type="text"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                />
                <label className="block font-semibold mb-1" style={{textAlign: "left"}}>Nickname</label>
                <input
                    type="text"
                    placeholder="Enter nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                />
                <button onClick={done ? jump : register} disabled={loading} style={styles.buttonPrimary}>
                    {loading ? "Processing..." : done ? "Back to Home" : "Register Account"}
                </button>
                <button onClick={() => {
                    logoutCurrentUser()
                    window.location.href = "/login";
                }} disabled={loading} hidden={done} style={styles.buttonDanger}>
                    Cancel
                </button>
                {message && <p style={message.startsWith("✅") ? styles.successMessage : styles.errorMessage}>{message}</p>}
            </div>
        </div>
    );

    switch (userStatus) {
        case "":
            return <div>Fetching user state...</div>;
        case "unverified":
            console.log("Current user is unverified, redirecting to login page...");
            window.location.href = "/login";
            break;
        case "registered":
            console.log("Current user is registered, redirecting to main page...");
            window.location.href = "/";
            break;
        default:
            return mainRender();
    }
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
        // alignItems: "center",
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
        marginBottom: "10px",
        marginTop: "10px",
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
    buttonDanger: {
        padding: "10px 20px",
        backgroundColor: "#a72828",
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

export default Register;