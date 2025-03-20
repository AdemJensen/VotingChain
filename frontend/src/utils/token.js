import {API_BASE_URL} from "./backend.js";

export function attachTokenForCurrentUser(headers) {
    return attachTokenFor(getCurrentUser(), headers);
}

export function attachTokenFor(walletAddr, headers) {
    const token = getTokenFor(walletAddr)
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export function setTokenFor(walletAddr, token) {
    localStorage.setItem('authToken_' + walletAddr, token);
}

export function getTokenFor(walletAddr) {
    return localStorage.getItem('authToken_' + walletAddr) ?? "";
}

export function setCurrentUser(walletAddr) {
    console.log("Current user switched to: ", walletAddr);
    localStorage.setItem('currentUser', walletAddr);
}

export function getCurrentUser() {
    return localStorage.getItem('currentUser') ?? "";
}

export function getTokenForCurrentUser() {
    console.log("Get token for current user (%s): %s", getCurrentUser(), getTokenFor(getCurrentUser()));
    return getTokenFor(getCurrentUser());
}

export async function getUserStatus(walletAddr) {
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