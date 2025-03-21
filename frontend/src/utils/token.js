import {API_BASE_URL} from "./backend.js";
import md5 from "md5";

export function normalizeHex(hex) {
    // to lower
    hex = hex.toLowerCase();
    // remove 0x prefix
    if (hex.startsWith("0x")) {
        hex = hex.slice(2);
    }
    return hex;
}

export function normalizeHex0x(hex) {
    hex = normalizeHex(hex);
    return "0x" + hex;
}

export function attachTokenForCurrentUser(headers) {
    return attachTokenFor(getCurrentUser(), headers);
}

export function attachTokenFor(walletAddr, headers) {
    walletAddr = normalizeHex(walletAddr);
    const token = getTokenFor(walletAddr)
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export function setTokenFor(walletAddr, token) {
    walletAddr = normalizeHex(walletAddr);
    localStorage.setItem('authToken_' + walletAddr, token);
}

export function logoutCurrentUser() {
    setTokenFor(getCurrentUser(), "");
    setCurrentUser("");
}

export function getTokenFor(walletAddr) {
    walletAddr = normalizeHex(walletAddr);
    return localStorage.getItem('authToken_' + walletAddr) ?? "";
}

export function setCurrentUser(walletAddr) {
    walletAddr = normalizeHex(walletAddr);
    console.log("Current user switched to: ", walletAddr);
    localStorage.setItem('currentUser', walletAddr);
}

export function getCurrentUser() {
    return normalizeHex(localStorage.getItem('currentUser')) ?? "";
}

export function getTokenForCurrentUser() {
    console.log("Get token for current user (%s): %s", getCurrentUser(), getTokenFor(getCurrentUser()));
    return getTokenFor(getCurrentUser());
}

export async function getUserStatus(walletAddr) {
    walletAddr = normalizeHex(walletAddr);
    try {
        const response = await fetch(API_BASE_URL + "/auth/state", {
            method: "GET",
            headers: attachTokenFor(walletAddr, { "Content-Type": "application/json" })
        });

        if (!response.ok) {
            console.error("Error checking user status:", response.status);
            return "unverified";
        }
        const data = await response.json();
        return data.status;
        // 系统未初始化
    } catch (error) {
        console.error("Error checking user status:", error);
        return "unverified";
    }
}

export async function getCurrentUserStatus() {
    return getUserStatus(getCurrentUser());
}

export async function batchGetUserInfoFromWeb3() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log("Linked accounts: ", accounts);
    return batchGetUserInfo(accounts);
}

async function batchGetUserInfo(accounts) {
    const tokens = [];
    for (const account of accounts) {
        tokens.push(getTokenFor(account));
    }

    const response = await fetch(API_BASE_URL + "/auth/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            wallet_addresses: accounts,
            jwt_tokens: tokens
        })
    });
    if (!response.ok) {
        console.error("Error checking user status:", response.status);
        return {};
    }
    const res = await response.json();
    return res.info;
}

export async function getUserInfo(account) {
    account = normalizeHex(account);
    const info = await batchGetUserInfo([account]);
    return info[account];
}

export async function getCurrentUserInfo() {
    return getUserInfo(getCurrentUser());
}

export function getGravatarAddress(email, size) {
    return `https://www.gravatar.com/avatar/${md5(email)}?s=${size}&d=identicon`;
}