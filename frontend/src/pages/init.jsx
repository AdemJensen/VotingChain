import React, { useState } from "react";
import Web3 from "web3";
import { API_BASE_URL } from "../utils/backend.js";

const Init = () => {
    const [walletAddress, setWalletAddress] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const connectMetaMask = async () => {
        if (window.ethereum) {
            try {
                const web3 = new Web3(window.ethereum);
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3.eth.getAccounts();
                setWalletAddress(accounts[0]);
            } catch (error) {
                console.error("MetaMask connection failed", error);
                setMessage("Failed to connect to MetaMask");
            }
        } else {
            setMessage("MetaMask is not installed");
        }
    };

    const initRootUser = async () => {
        if (!walletAddress || !privateKey) {
            setMessage("Please enter a valid private key and connect MetaMask");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/init`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    private_key: privateKey
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(`✅ Success! NFT Contract: ${data.nft_contract}`);
            } else {
                setMessage(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        }

        setLoading(false);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.box}>
                <h1 style={styles.title}>Initialize Root User</h1>
                <p style={styles.text}>
                    This process will set up the blockchain voting system and deploy the main NFT contract.
                </p>
                <button onClick={connectMetaMask} style={styles.button}>
                    {walletAddress ? `Connected: ${walletAddress}` : "Connect MetaMask"}
                </button>
                <input
                    type="password"
                    placeholder="Enter Private Key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    style={styles.input}
                />
                <button onClick={initRootUser} disabled={loading} style={styles.buttonPrimary}>
                    {loading ? "Initializing..." : "Initialize Root User"}
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
        fontSize: "24px",
        fontWeight: "bold",
        marginBottom: "10px",
    },
    text: {
        fontSize: "16px",
        marginBottom: "20px",
        color: "#666",
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