import Manager from "../artifacts/Manager_sol_Manager.json";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav.jsx";
import Sidebar from "../components/SideBar.jsx";
import {waitForReceipt} from "../utils/contracts.js";
import { useToast } from "../context/ToastContext";
import Web3 from "web3";
import {getCurrentUser, normalizeHex0x} from "../utils/token.js";
import {getManagerAddr} from "../utils/backend.js";

export default function AdminManage() {
    const toast = useToast();
    const [admins, setAdmins] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAddress, setNewAddress] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchAdmins = async () => {
        const web3 = new Web3(window.ethereum)
        const Contract = new web3.eth.Contract(Manager.abi, getManagerAddr());
        const adminAddresses = await Contract.methods.getAllAdmins().call();
        const admins = await Promise.all(adminAddresses.map(async (addr) => {
            const info = await Contract.methods.getUserByAddress(addr).call();
            return {
                email: info.email,
                nickname: info.nickname,
                role: info.role,
                wallet_address: info.wallet_address,
                create_time: info.create_time,
            };
        }));
        console.log(admins)
        setAdmins(admins)
    };

    const handleAddAdmin = async () => {
        try {
            const web3 = new Web3(window.ethereum)
            const Contract = new web3.eth.Contract(Manager.abi, getManagerAddr());
            console.log("newAddress", normalizeHex0x(newAddress))
            console.log("getCurrentUser", getCurrentUser())
            await Contract.methods.addAdmin(normalizeHex0x(newAddress)).send({ from: getCurrentUser() });
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
            const web3 = new Web3(window.ethereum)
            const Contract = new web3.eth.Contract(Manager.abi, getManagerAddr());
            await Contract.methods.removeAdmin(normalizeHex0x(deleteTarget)).send({ from: getCurrentUser() });
            setDeleteTarget(null);
            await fetchAdmins()
            toast("Successfully removed admin!", "success");
        } catch (err) {
            console.error("Failed to remove admin:", err);
            toast("Failed to remove admin: " + err.message, "error");
        }
    };

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
                                    {admin.wallet_address}
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
                            <p className="mb-4" style={{lineBreak: "anywhere"}}>Are you sure you want to remove admin: {deleteTarget} ?</p>
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