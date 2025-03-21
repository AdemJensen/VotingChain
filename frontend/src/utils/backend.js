import { attachTokenForCurrentUser } from "./token.js";

export const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

export async function getVotingNftAddr() {
    // get NFT contract address
    const nftAddrResp = await fetch(API_BASE_URL + "/votes/nft-addr", {
        method: "GET",
        headers: attachTokenForCurrentUser({ "Content-Type": "application/json" })
    });
    const nftAddrRes = await nftAddrResp.json();
    if (!nftAddrResp.ok) {
        throw new Error("Failed to fetch NFT contract address: " + nftAddrRes.error);
    }
    return nftAddrRes.addr;
}