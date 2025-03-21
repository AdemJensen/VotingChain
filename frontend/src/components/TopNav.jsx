import md5 from 'md5';
import { useState } from 'react';
import UserMenu from './UserMenu';

export default function TopNav({ user, onLogout, onSwitchUser }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(user.email)}?s=40&d=identicon`;

    return (
        <div className="flex justify-between items-center bg-white shadow px-6 py-4">
            <h1 className="text-xl font-bold">VotingChain</h1>
            <div className="relative">
                <img
                    src={gravatarUrl}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full cursor-pointer"
                    onClick={() => setMenuOpen(!menuOpen)}
                />
                {menuOpen && (
                    <UserMenu
                        onClose={() => setMenuOpen(false)}
                        onLogout={onLogout}
                        onSwitchUser={onSwitchUser}
                    />
                )}
            </div>
        </div>
    );
}