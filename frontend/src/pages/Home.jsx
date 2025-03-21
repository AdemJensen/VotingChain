import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import SwitchUserPanel from "../components/SwitchUserPanel";
import { useState } from "react";

export default function Dashboard() {
    const [user, setUser] = useState({
        nickname: "张三",
        email: "test@example.com",
        role: "root",
    });

    const [showSwitchPanel, setShowSwitchPanel] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("jwt");
        window.location.href = "/login";
    };

    const handleSwitchUser = () => {
        setShowSwitchPanel(true);
    };

    const handleSelectUser = (walletAddress) => {
        setShowSwitchPanel(false);
        alert(`切换到用户：${walletAddress}`);
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-100">
            {/* 顶部导航栏 */}
            <TopNav user={user} onLogout={handleLogout} onSwitchUser={handleSwitchUser} />

            <div className="flex flex-1">
                {/* 侧边栏，占 20% 宽度 */}
                <Sidebar role={user.role} className="w-1/5 bg-gray-200" />

                {/* 主内容区域，占剩余 80% 宽度 */}
                <main className="flex-1 p-8 bg-white rounded-lg shadow-lg mx-8 my-6">
                    <h2 className="text-3xl font-bold mb-4">欢迎回来，{user.nickname}！</h2>
                    <p className="text-gray-600">请选择左侧功能开始使用系统。</p>
                </main>
            </div>

            {showSwitchPanel && (
                <SwitchUserPanel onClose={() => setShowSwitchPanel(false)} onSelect={handleSelectUser} />
            )}
        </div>
    );
}