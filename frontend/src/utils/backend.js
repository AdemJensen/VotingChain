// export const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

import Web3 from "web3";
import Manager from "../artifacts/Manager_sol_Manager.json";
import {normalizeHex0x, setCurrentUser} from "./token.js";

export async function setNetwork(addr) {
    const web3 = new Web3(window.ethereum)
    const ManagerContract = new web3.eth.Contract(Manager.abi, addr);
    const nftContractAddr = await ManagerContract.methods.getNFTAddr().call();
    localStorage.setItem('_manager_addr', normalizeHex0x(addr));
    localStorage.setItem('_nft_addr', normalizeHex0x(nftContractAddr));
    setCurrentUser("");
}

export function getVotingNftAddr() {
    // get NFT contract address
    return localStorage.getItem('_nft_addr') ?? "";
}

export function getManagerAddr() {
    // get NFT contract address
    return localStorage.getItem('_manager_addr') ?? "";
}