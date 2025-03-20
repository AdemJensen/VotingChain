import {API_BASE_URL} from "./backend.js";

export async function checkSystemInit() {
    try {
        console.log("Backend API Base URL:", API_BASE_URL);
        console.log("Backend API Base URL:", import.meta.env.BACKEND_API_BASE_URL);
        const response = await fetch(API_BASE_URL + "/init", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        return response.status === 403;
         // 系统未初始化
    } catch (error) {
        console.error("Error checking system init status:", error);
        return false;
    }
}