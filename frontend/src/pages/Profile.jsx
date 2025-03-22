import {useEffect, useState} from "react";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import {getCurrentUserInfo, getGravatarAddress, attachTokenForCurrentUser} from "../utils/token.js";
import {API_BASE_URL} from "../utils/backend.js";
import { useToast } from "../context/ToastContext";

export default function Profile() {
    const toast = useToast();
    const [nickname, setNickname] = useState('');
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const getUserInfo = async () => {
            const info = await getCurrentUserInfo()
            setUserInfo(info);
            setNickname(info.nickname);
        }
        getUserInfo()
    }, []);

    if (!userInfo) {
        return <div>Loading...</div>;
    }

    const handleSave = async () => {
        const response = await fetch(`${API_BASE_URL}/auth/update`, {
            method: "POST",
            headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
            body: JSON.stringify({
                nickname: nickname
            })
        });

        const data = await response.json();
        if (!response.ok) {
            toast(`Update user info error: ${data.error}`, "error");
            return;
        }

        toast(`User info updated.`, "success");
        window.location.reload();
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 text-gray-800 overflow-hidden">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    role={userInfo.role} currentPanel={""}
                    className="w-1/5 bg-gray-100 overflow-y-auto"
                />

                <main className="flex-1 p-10 overflow-y-auto">
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-6">
                        <h1 className="text-3xl font-bold mb-6">Personal Information</h1>

                        <div className="max-w-lg">

                            <label className="block font-semibold mb-1">Email Address</label>
                            <input
                                type="text"
                                value={userInfo.email}
                                readOnly
                                className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                            />

                            <label className="block font-semibold mb-1">Bound Wallet Address</label>
                            <input
                                type="text"
                                value={"0x" + userInfo.wallet_address}
                                readOnly
                                className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                            />

                            <label className="block font-semibold mb-1">User Role</label>
                            <input
                                type="text"
                                value={userInfo.role}
                                readOnly
                                className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4"
                            />

                            <label className="block font-semibold mb-1">Nickname</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                            />

                            <label className="block font-semibold mb-1">Gravatar Preview</label>
                            <img src={getGravatarAddress(userInfo.email, 160)} alt="Gravatar Preview" className="rounded-full border mb-2" />
                            <p className="text-sm text-gray-600">Go to <a href={"https://gravatar.com/"} target={"_blank"}>Gravatar</a> to customize your avatar.</p>
                            <button
                                onClick={handleSave}
                                className="mt-4 px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}