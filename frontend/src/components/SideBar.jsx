import { useState } from "react";

const roleMenus = {
    user: ["投票列表", "我的记录"],
    admin: ["创建投票"],
    root: ["管理员设置"],
};

function getMenus(role) {
    const roles = ["user"];
    if (role === "admin") roles.push("admin");
    if (role === "root") roles.push("admin", "root");
    const menuSet = new Set();
    roles.forEach((r) => roleMenus[r].forEach((item) => menuSet.add(item)));
    return Array.from(menuSet);
}

export default function Sidebar({ role }) {
    const menus = getMenus(role);
    const [active, setActive] = useState(menus[0]);

    return (
        <aside className="w-1/5 bg-gray-200 text-gray-800 h-full p-6 shadow-md">
            {/* 标题部分 */}
            <h2 className="text-lg font-semibold mb-4 text-gray-700">📌 功能菜单</h2>

            {/* 分隔线 */}
            <div className="border-t border-gray-400 mb-4"></div>

            {/* 菜单列表 */}
            <ul className="space-y-2">
                {menus.map((item) => (
                    <li key={item}>
                        <button
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 
                ${
                                active === item
                                    ? "bg-gray-300 text-gray-900 shadow-md"
                                    : "text-gray-700 hover:bg-gray-400 hover:text-black"
                            }`}
                            onClick={() => setActive(item)}
                        >
                            {item}
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}