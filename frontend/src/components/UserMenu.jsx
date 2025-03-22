import React from "react";

const getRoleBadge = (role) => {
    switch (role) {
        case "admin":
            return (
                <span className="px-3 py-1 ml-1 bg-pink-400 text-white text-xs rounded-full">
                    Admin
                </span>
            );
        case "root":
            return (
                <span className="px-3 py-1 ml-1 bg-purple-400 text-white text-xs rounded-full">
                    Root
                </span>
            );
        case "user":
            return (
                <span className="px-3 py-1 ml-1 bg-sky-400 text-white text-xs rounded-full">
                    User
                </span>
            );
        default:
            return (
                <span className="px-3 py-1 ml-1 bg-yellow-400 text-white text-xs rounded-full">
                    Not Registered
                </span>
            );
    }
}

export default function UserMenu({ userInfo, onLogout, onSwitchUser, onClose }) {
    return (
        <div className="absolute right-0 mt-2 w-max bg-white shadow-md rounded z-10">
            <button
                disabled={true}
                className="block w-full text-center px-5 py-2 text-gray-400 mt-2"
                style={{cursor: "default"}}
            >
                {userInfo.nickname} {getRoleBadge(userInfo.role)}
            </button>

            {/* 分隔线 */}
            <div className="border-t border-gray-200 m-1"></div>

            <button
                className="block w-full text-center px-5 py-2 hover:bg-gray-100"
                onClick={() => {
                    onClose();
                    window.location.href = '/profile';
                }}
            >
                Profile
            </button>
            <button
                className="block w-full text-center px-5 py-2 hover:bg-gray-100"
                onClick={() => {
                    onClose();
                    onSwitchUser();
                }}
            >
                Switch User
            </button>
            <button
                className="block w-full text-center px-5 py-2 text-red-600 hover:bg-gray-100"
                onClick={onLogout}
            >
                Logout
            </button>
        </div>
    );
}