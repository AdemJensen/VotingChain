import { useEffect, useState } from "react";
import TopNav from "../components/TopNav.jsx";
import Sidebar from "../components/SideBar.jsx";
import {attachTokenForCurrentUser, getCurrentUser} from "../utils/token.js";
import {executeBackendBuiltTx} from "../utils/contracts.js";
import {API_BASE_URL} from "../utils/backend.js";
import { useToast } from "../context/ToastContext";

export default function AdminManage() {
    const toast = useToast();
    const [admins, setAdmins] = useState([]);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAddress, setNewAddress] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchAdmins = async () => {
        const response = await fetch(API_BASE_URL + "/admin/list", {
            method: "GET",
            headers: attachTokenForCurrentUser({ "Content-Type": "application/json" })
        });
        if (!response.ok) {
            console.error("Error checking user status:", response.status);
            return;
        }
        const res = await response.json();
        console.log(res.users)
        setAdmins(res.users)
    };

    const handleAddAdmin = async () => {
        try {
            const response = await fetch(API_BASE_URL + "/admin/add-build", {
                method: "POST",
                headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    wallet_address: newAddress
                })
            });
            const res = await response.json();
            if (!response.ok) {
                toast("Failed to build add admin contract: " + res.error, "error");
                return;
            }

            const txHash = await executeBackendBuiltTx(getCurrentUser(), res.tx);
            console.log("Transaction hash:", txHash);

            const response2 = await fetch(API_BASE_URL + "/admin/add-exec", {
                method: "POST",
                headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    wallet_address: newAddress,
                    tx_hash: txHash,
                })
            });
            const res2 = await response2.json();
            if (!response2.ok) {
                toast("Failed to build add admin to db: " + res2.error, "error");
                return;
            }
            setNewAddress("");
            setShowAddModal(false);
            await fetchAdmins()
            toast("Successfully added admin!", "success");
        } catch (err) {
            console.error("Failed to add admin:", err);
            toast("Failed to add admin: " + err.message, "error");
        }
    };

    const handleDeleteAdmin = async () => {
        try {
            const response = await fetch(API_BASE_URL + "/admin/remove-build", {
                method: "POST",
                headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    wallet_address: deleteTarget
                })
            });
            const res = await response.json();
            if (!response.ok) {
                toast("Failed to build remove admin contract: " + res.error, "error");
                return;
            }

            const txHash = await executeBackendBuiltTx(getCurrentUser(), res.tx);
            console.log("Transaction hash:", txHash);

            const response2 = await fetch(API_BASE_URL + "/admin/remove-exec", {
                method: "POST",
                headers: attachTokenForCurrentUser({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    wallet_address: deleteTarget,
                    tx_hash: txHash,
                })
            });
            const res2 = await response2.json();
            if (!response2.ok) {
                toast("Failed to build remove admin to db: " + res2.error, "error");
                return;
            }
            setDeleteTarget(null);
            await fetchAdmins()
            toast("Successfully removed admin!", "success");
        } catch (err) {
            console.error("Failed to remove admin:", err);
            toast("Failed to remove admin: " + err.message, "error");
        }
    };

    const handleSyncAdminList = async () => {
        const response = await fetch(API_BASE_URL + "/admin/sync", {
            method: "POST",
            headers: attachTokenForCurrentUser({ "Content-Type": "application/json" })
        });
        if (!response.ok) {
            console.error("Error checking user status:", response.status);
            toast("Failed to sync with blockchain", "error");
            return {};
        }
        const res = await response.json();
        console.log(res);
        await fetchAdmins();
        setShowSyncModal(false);
        toast("Successfully synced with blockchain!", "success");
    }

    useEffect(() => {
        fetchAdmins();
    }, []);

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 text-gray-800">
            {/* 顶部导航栏 */}
            <TopNav />

            <div className="flex flex-1 overflow-hidden">
                {/* 侧边栏，占 20% 宽度 */}
                <Sidebar role={"root"} currentPanel={"Admin Management"} className="w-1/5 bg-gray-100" />

                {/* 主内容区域，占剩余 80% 宽度 */}
                <main className="flex-1 overflow-y-auto p-8 bg-white rounded-lg shadow-lg mx-8 my-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Admin Management</h2>
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => setShowSyncModal(true)}
                                className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-700 text-white mr-4"
                            >
                                Sync With Blockchain
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white"
                            >
                                Add Admin
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {admins.map((admin) => (
                            <div
                                key={admin.wallet_address}
                                className="relative bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg p-4"
                            >
                                {/* 昵称 */}
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                    {admin.nickname || "Unnamed User"}
                                </h3>

                                {/* 地址 */}
                                <p className="text-sm text-gray-500 break-all mt-3">
                                    0x{admin.wallet_address}
                                </p>

                                {/* 删除按钮 */}
                                <button
                                    hidden={admin.role === "root"}
                                    onClick={() => setDeleteTarget(admin.wallet_address)}
                                    className="absolute top-2 right-2 text-sm text-red-500 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
                {showSyncModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-lg w-150">
                            <h2 className="text-xl font-bold mb-4">Sync With Blockchain</h2>
                            <p className="mb-4" style={{lineBreak: "anywhere"}}>Are you sure you want to sync with blockchain?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowSyncModal(false)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSyncAdminList}
                                    className="px-4 py-2 text-red-800 bg-red-200 hover:bg-red-300 rounded"
                                >
                                    Confirm Sync
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-lg w-150">
                            <h2 className="text-xl font-bold mb-4">Add Admin</h2>
                            <input
                                className="w-full border px-3 py-2 mb-4 rounded"
                                placeholder="Wallet Address"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAdmin}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Confirm Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 删除确认弹窗 */}
                {deleteTarget && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-lg w-150">
                            <h2 className="text-xl font-bold mb-4">Confirm Remove Admin</h2>
                            <p className="mb-4" style={{lineBreak: "anywhere"}}>Are you sure you want to remove admin: 0x{deleteTarget} ?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAdmin}
                                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-800 rounded"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}