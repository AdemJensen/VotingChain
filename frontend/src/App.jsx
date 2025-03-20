import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Init from "./pages/init.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
// import Home from "./pages/Home"; // 主页
// import Dashboard from "./pages/Dashboard"; // 其他页面

const AppRoutes = () => {
    return (
        <Routes>
            {/*<Route path="/" element={<Home />} />*/}
            {/*<Route path="/dashboard" element={<Dashboard />} />*/}
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