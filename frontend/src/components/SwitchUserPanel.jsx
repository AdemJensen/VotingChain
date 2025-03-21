import { useEffect, useState } from 'react';

export default function SwitchUserPanel({ onClose, onSelect }) {
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        async function loadAccounts() {
            if (window.ethereum) {
                try {
                    const accs = await window.ethereum.request({ method: 'eth_accounts' });
                    setAccounts(accs);
                } catch (err) {
                    console.error('获取钱包地址失败', err);
                }
            } else {
                alert('请安装 MetaMask 插件');
            }
        }
        loadAccounts();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4">切换用户</h2>
                {accounts.length === 0 ? (
                    <p className="text-gray-500">没有检测到已授权的钱包地址。</p>
                ) : (
                    <ul>
                        {accounts.map((acc) => (
                            <li key={acc} className="mb-2">
                                <button
                                    className="w-full text-left border px-4 py-2 rounded hover:bg-gray-100"
                                    onClick={() => onSelect(acc)}
                                >
                                    {acc}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <button
                    onClick={onClose}
                    className="mt-4 text-sm text-gray-500 hover:underline"
                >
                    取消
                </button>
            </div>
        </div>
    );
}