export default function UserMenu({ userInfo, onLogout, onSwitchUser, onClose }) {
    return (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded z-10">
            <button
                disabled={true}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
                {userInfo.nickname} ({userInfo.role})
            </button>
            <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                    onClose();
                    window.location.href = '/profile';
                }}
            >
                个人信息
            </button>
            <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                    onClose();
                    onSwitchUser();
                }}
            >
                切换用户
            </button>
            <button
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                onClick={onLogout}
            >
                登出
            </button>
        </div>
    );
}