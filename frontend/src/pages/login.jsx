import React, { useState } from "react";
import Web3 from "web3";
import { API_BASE_URL } from "../utils/backend.js";

const Init = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const login = async () => {
        setLoading(true);
        setMessage("");

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log(accounts);
            const account = accounts[0];
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

            const data2 = await response2.json();
            if (response2.ok) {
                setMessage(`✅ Success! Welcome.`);
            } else {
                setMessage(`❌ Error: ${data2.error}`);
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
                <button onClick={login} disabled={loading} style={styles.buttonPrimary}>
                    {loading ? "Verifying..." : "Login Via MetaMask"}
                </button>
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

export default Init;