import Web3 from "web3";
import {normalizeHex0x} from "./token.js";

export async function executeBackendBuiltTx(walletAddress, txJsonStr) {
    const web3 = new Web3(window.ethereum);

    const tx = JSON.parse(txJsonStr);
    const txObject = {
        from: normalizeHex0x(walletAddress),
        gas: web3.utils.toHex(tx.gas),
        gasPrice: web3.utils.toHex(tx.gasPrice),
        value: web3.utils.toHex(tx.value),
        data: tx.input,
        nonce: web3.utils.toHex(tx.nonce),
    };
    console.log("Original TX:", tx);
    if (tx.to && tx.to !== "0x0" && tx.to !== "0x") {
        txObject.to = tx.to;
    }
    console.log("Transaction to be sent:", txObject);

    // 3. Send transaction via MetaMask
    // return txHash
    return await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txObject],
    });
}

export async function deployContract(walletAddress, abi, bytecode) {
    const web3 = new Web3(window.ethereum);
    const txObject = {
        from: normalizeHex0x(walletAddress),
        gas: web3.utils.toHex(0),
        gasPrice: web3.utils.toHex(),
        value: web3.utils.toHex(0),
        data: bytecode,
        nonce: web3.utils.toHex(tx.nonce),
    };
}

export async function waitForReceipt(web3, txHash, interval = 1000, timeout = 60000) {
    const start = Date.now();
    while (true) {
        const receipt
            = await web3.eth.getTransactionReceipt(txHash);
        if (receipt) return receipt;
        if (Date.now() - start > timeout) throw new Error("Timeout waiting for receipt");
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}
