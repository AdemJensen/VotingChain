import Manager from "../artifacts/Manager_sol_Manager.json";
import md5 from "md5";
import Web3 from "web3";
import {getManagerAddr} from "./backend.js";

export function normalizeHex(hex) {
    if (!hex) {
        return "";
    }
    // to lower
    hex = hex.toLowerCase();
    // remove 0x prefix
    if (hex.startsWith("0x")) {
        hex = hex.slice(2);
    }
    return hex;
}

export function hexEqual(hex1, hex2) {
    return normalizeHex(hex1) === normalizeHex(hex2);
}

export function normalizeHex0x(hex) {
    hex = normalizeHex(hex);
    return "0x" + hex;
}

export function logoutCurrentUser() {
    setCurrentUser("");
}

export function setCurrentUser(walletAddr) {
    walletAddr = normalizeHex0x(walletAddr);
    console.log("Current user switched to: ", walletAddr);
    localStorage.setItem('currentUser', walletAddr);
}

export function getCurrentUser() {
    return normalizeHex0x(localStorage.getItem('currentUser')) ?? "";
}

async function getUserStatus(web3, walletAddr) {
    walletAddr = normalizeHex0x(walletAddr);
    try {
        const Contract = new web3.eth.Contract(Manager.abi, getManagerAddr());
        const exists = await Contract.methods.userExists(walletAddr).call();
        if (exists) {
            return "registered";
        } else {
            return "verified";
        }
        // 系统未初始化
    } catch (error) {
        console.error("Error checking user status:", error);
        return "verified";
    }
}

export async function getCurrentUserStatus() {
    const web3 = new Web3(window.ethereum)
    return getUserStatus(web3, getCurrentUser());
}

export async function batchGetUserInfoFromWeb3() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log("Linked accounts: ", accounts);
    return batchGetUserInfo(accounts);
}

async function batchGetUserInfo(accounts) {
    const userMap = {};
    const web3 = new Web3(window.ethereum)
    const Contract = new web3.eth.Contract(Manager.abi, getManagerAddr());
    for (let i = 0; i < accounts.length; i++) {
        const account = normalizeHex0x(accounts[i])
        const info = await Contract.methods.getUserByAddress(account).call();
        userMap[account] = {
            wallet_address: account,
            nickname: info.nickname,
            email: info.email,
            role: info.role,
            state: info.role === "" ? "verified" : "registered",
        }
    }
    return userMap;
}

export async function getUserInfo(account) {
    account = normalizeHex0x(account);
    const info = await batchGetUserInfo([account]);
    console.log("User info: ", info);
    console.log("User info[account]: ", info[account]);
    return info[account];
}

export async function getCurrentUserInfo() {
    return getUserInfo(getCurrentUser());
}

export function getGravatarAddress(email, size) {
    if (!email) {
        email = ""
    }
    return `https://www.gravatar.com/avatar/${md5(email)}?s=${size}&d=identicon`;
}