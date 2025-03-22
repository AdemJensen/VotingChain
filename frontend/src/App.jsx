import React, {useEffect, useState} from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import "./App.css";
import Init from "./pages/Init.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
// import Dashboard from "./pages/Home.jsx"; // 主页
import Profile from "./pages/Profile.jsx"; // 其他页面
import {getCurrentUser, getUserStatus} from "./utils/token.js"
import AdminManagement from "./pages/AdminManage.jsx";
import CreateVote from "./pages/CreateVote.jsx";
import VoteList from "./pages/VoteList.jsx";
import VoteDetails from "./pages/VoteDetails.jsx";

const AppRoutes = () => {
    const [userStatus, setUserStatus] = useState(null)

    useEffect( () => {
        const fetchUserStatus = async () => {
            setUserStatus(await getUserStatus(getCurrentUser()))
        }
        fetchUserStatus();
    }, []);

    if (userStatus === null) {
        return <div>Loading...</div>
    }

    console.log(window.location);
    if (userStatus === "verified" && window.location.pathname !== "/register") {
        // if verified but not registered, redirect to register
        window.location.href = "/register";
    }

    return (
        <Routes>
            <Route path="/" element={<VoteList mode={"full"} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/init" element={<Init />} />
            <Route path="/login" element={<Login title={"Login"} />} />
            <Route path="/switch" element={<Login title={"Switch User"} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-manage" element={<AdminManagement />} />
            <Route path="/votes/create" element={<CreateVote />} />
            <Route path="/votes" element={<VoteList mode={"full"} />} />
            <Route path="/votes/mine" element={<VoteList mode={"mine"} />} />
            <Route path="/votes/managed" element={<VoteList mode={"managed"} />} />
            <Route path="/vote/:contract" element={<VoteDetails />} />
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