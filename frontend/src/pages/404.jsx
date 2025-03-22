import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 h-screen w-screen">
            <div className="max-w-xl w-full text-center p-8 bg-white shadow-xl rounded-2xl">
                <h1 className="text-9xl font-extrabold text-gray-300 mb-4">404</h1>
                <h2 className="text-3xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
                <p className="text-gray-600 mb-6">
                    Sorry, the page you are looking for doesn't exist or has been moved.
                </p>
                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 transition-all"
                >
                    Go back to Home
                </button>
            </div>
        </div>
    );
}
