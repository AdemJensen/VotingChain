import {API_BASE_URL} from "./backend.js";

export async function checkSystemInit() {
    try {
        const response = await fetch(API_BASE_URL + "/init", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await response.text();

        return data === "i";
         // 系统未初始化
    } catch (error) {
        console.error("Error checking system init status:", error);
        return false;
    }
}