const roleMenus = {
    "": ["All Votes"],
    user: ["Participated Votes"],
    admin: ["Managed Votes", "Create Vote"],
    root: ["Admin Management"],
};

const navLocations = {
    "All Votes": "/votes/all",
    "Participated Votes": "/votes/mine",
    "Create Vote": "/votes/create",
    "Managed Votes": "/votes/managed",
    "Admin Management": "/admin-manage",
}

function jumpTo(item) {
    window.location.href = navLocations[item];
}

function getMenus(role) {
    const roles = [""];
    if (role === "user") roles.push("user");
    if (role === "admin") roles.push("user", "admin");
    if (role === "root") roles.push("user", "admin", "root");
    const menuSet = new Set();
    roles.forEach((r) => roleMenus[r].forEach((item) => menuSet.add(item)));
    return Array.from(menuSet);
}

export default function Sidebar({ role, currentPanel }) {
    const menus = getMenus(role);
    // console.log("CURRENT PANEL:", currentPanel);
    // console.log("Menus:", menus);

    return (
        <aside className="bg-gray-200 text-gray-800 h-full p-6 shadow-md">
            {/* 菜单列表 */}
            <ul className="space-y-2">
                {menus.map((item) => (
                    <li key={item}>
                        <button
                            onClick={() => jumpTo(item)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 
                            ${
                                currentPanel === item
                                    ? "bg-gray-300 text-gray-900 shadow-md font-bold"
                                    : "text-gray-500 hover:bg-gray-400 hover:text-black"
                            }`}
                        >
                            {item}
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}