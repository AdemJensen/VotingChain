import {useEffect, useState} from 'react';
import UserMenu from './UserMenu';
import {saveHref} from "../utils/nav.js";
import {getCurrentUserInfo, getCurrentUser, logoutCurrentUser, getGravatarAddress} from "../utils/token.js";
import {getManagerAddr} from "../utils/backend.js";

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
        gravatarUrl = getGravatarAddress(userInfo.email, 120);
    }

    const onLogout = () => {
        logoutCurrentUser()
        setUserInfo({});
        window.location.reload();
    }

    const onLogin = () => {
        saveHref();
        window.location = "/login"
    }

    const onInit = () => {
        saveHref();
        window.location = "/init"
    }

    const onSwitchUser = () => {
        saveHref();
        window.location = "/switch"
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
            onSwitchUser={onSwitchUser}
        />
    )}</div>)

    return (
        <div className="flex justify-between items-center bg-white shadow px-6 py-4">
            <div className="flex items-center">
                <img src="/logo.png" width="50px" alt="80px"/>
                <h1 className="text-xl font-bold ml-4">VotingChain</h1>
                <button className="px-4 py-2 ml-8 rounded-lg transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-600" onClick={onInit}>
                    Network: {getManagerAddr()}
                </button>
            </div>
            <div className="flex items-center">
                <div className="relative">
                    {getCurrentUser() === "" ? (
                        <button className="w-full px-4 py-2 rounded-lg transition-all duration-200 bg-blue-400 hover:bg-blue-500 text-white" onClick={onLogin}>
                            Login
                        </button>
                    ) : menu()}
                </div>
            </div>
        </div>
    );
}