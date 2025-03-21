import {useEffect, useState} from 'react';
import UserMenu from './UserMenu';
import {getCurrentUserInfo, getCurrentUser, logoutCurrentUser, getGravatarAddress} from "../utils/token.js";

export default function TopNav() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const getUserInfo = async () => {
            setUserInfo(await getCurrentUserInfo());
        }
        getUserInfo()
    }, []);

    let gravatarUrl = "";
    if (!userInfo) {
        return <div className="flex justify-between items-center bg-white shadow px-6 py-4">
            <h1 className="text-xl font-bold">VotingChain</h1>
        </div>
    } else {
        gravatarUrl = getGravatarAddress(userInfo.email, 40);
    }

    const onLogout = () => {
        logoutCurrentUser()
        setUserInfo({});
        window.location = "/login"
    }

    const onLogin = () => {
        window.location = "/login"
    }

    const menu = () => (<div className="relative"> <img
        src={gravatarUrl}
        alt="User Avatar"
        className="w-10 h-10 rounded-full cursor-pointer"
        onClick={() => setMenuOpen(!menuOpen)}
    />
    {menuOpen && (
        <UserMenu
            userInfo={userInfo}
            onClose={() => setMenuOpen(false)}
            onLogout={onLogout}
            onSwitchUser={onLogin}
        />
    )}</div>)

    return (
        <div className="flex justify-between items-center bg-white shadow px-6 py-4">
            <h1 className="text-xl font-bold">VotingChain</h1>
            <div className="relative">
                {getCurrentUser() === "" ? (
                    <button className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200" onClick={onLogin}>
                        Login
                    </button>
                ) : menu()}
            </div>
        </div>
    );
}