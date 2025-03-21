import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import "./App.css";
import Init from "./pages/init.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Dashboard from "./pages/Home.jsx"; // 主页
import Profile from "./pages/Profile.jsx"; // 其他页面

const AppRoutes = () => {
    // return <h1 className="text-red-500 text-4xl font-bold">测试 Tailwind</h1>;
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/init" element={<Init />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    );
};

const App = () => {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
};

export default App;