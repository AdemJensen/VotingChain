import { useState } from 'react';
import md5 from 'md5';

export default function Profile() {
    const [nickname, setNickname] = useState('张三');
    const [email, setEmail] = useState('test@example.com');
    const [walletAddress, setWalletAddress] = useState('0x1234...abcd');

    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email)}?s=100&d=identicon`;

    const handleSave = () => {
        alert(`昵称已更新为：${nickname}`);
        // 实际中应发出 PATCH 请求保存用户信息
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">个人信息</h1>

            <div className="mb-4">
                <label className="block font-semibold mb-1">昵称</label>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>

            <div className="mb-4">
                <label className="block font-semibold mb-1">绑定钱包地址</label>
                <input
                    type="text"
                    value={walletAddress}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2"
                />
            </div>

            <div className="mb-4">
                <label className="block font-semibold mb-1">Gravatar 头像预览</label>
                <img src={gravatarUrl} alt="Gravatar Preview" className="rounded-full border" />
                <p className="text-sm text-gray-600 mt-1">邮箱：{email}</p>
            </div>

            <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                保存
            </button>
        </div>
    );
}