import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Init from "./pages/init.jsx";
// import Home from "./pages/Home"; // 主页
// import Dashboard from "./pages/Dashboard"; // 其他页面
import { checkSystemInit } from "./utils/checkInitStatus";

const AppRoutes = () => {
    const [isInitialized, setIsInitialized] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const fetchInitStatus = async () => {
            const initialized = await checkSystemInit();
            setIsInitialized(initialized);
        };
        fetchInitStatus();
    }, []);

    if (isInitialized === null) {
        return <div>Loading...</div>; // 避免直接跳转，先检查状态
    }

    // **如果系统未初始化，所有页面都跳转到 /init**
    if (!isInitialized && location.pathname !== "/init") {
        console.log("System not initialized, redirecting to /init");
        return <Navigate to="/init" replace />;
    }

    // **如果系统已经初始化，禁止访问 /init，返回 404**
    if (isInitialized && location.pathname === "/init") {
        console.log("System already initialized, redirecting to 404");
        return <Navigate to="/404" replace />;
    }

    return (
        <Routes>
            {/*<Route path="/" element={<Home />} />*/}
            {/*<Route path="/dashboard" element={<Dashboard />} />*/}
            <Route path="/init" element={<Init />} />
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