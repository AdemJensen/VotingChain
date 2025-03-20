import React, { useState } from "react";
import Web3 from "web3";
import { API_BASE_URL } from "../utils/backend.js";

const Init = () => {
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
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
        if (!walletAddress) {
            setMessage("Please connect MetaMask");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const web3 = new Web3(window.ethereum);

            const response = await fetch(`${API_BASE_URL}/init-build`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: walletAddress
                })
            });

            const data = await response.json();
            if (!response.ok) {
                setMessage(`❌ Error: ${data.error}`);
                setLoading(false);
                return;
            }
            const txJsonStr = data.tx;
            const tx = JSON.parse(txJsonStr);
            const txObject = {
                from: walletAddress,
                gas: web3.utils.toHex(tx.gas),
                gasPrice: web3.utils.toHex(tx.gasPrice),
                value: web3.utils.toHex(tx.value),
                data: tx.input,
                nonce: web3.utils.toHex(tx.nonce),
            };
            console.log("Transaction to be sent:", txObject);

            // 3. Send transaction via MetaMask
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txObject],
            });

            const response2 = await fetch(`${API_BASE_URL}/init-exec`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    tx_hash: txHash
                })
            });

            const data2 = await response2.json();
            if (response2.ok) {
                setMessage(`✅ Success! You can enjoy the system now.`);
                setDone(true);
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
                <h1 style={styles.title}>System Initialization</h1>
                <p style={styles.text}>
                    Congratulations, the voting system has been successfully deployed!
                </p>
                <p style={styles.text}>
                    Now, you need to link your Ethereum account to the system to create a root user in the system. This process will setup the database tables and deploy the main NFT contract.
                </p>
                <button onClick={connectMetaMask} style={styles.button}>
                    {walletAddress ? `Connected: ${walletAddress}` : "Connect MetaMask"}
                </button>
                <button onClick={initRootUser} disabled={loading || done} style={styles.buttonPrimary}>
                    {loading ? "Initializing..." : done ? "Initialization Complete" : "Initialize Root User"}
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