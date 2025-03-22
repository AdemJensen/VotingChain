import React, {useEffect, useState} from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import "./App.css";
import NotFoundPage from "./pages/404.jsx";
import Init from "./pages/Init.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
// import Dashboard from "./pages/Home.jsx"; // 主页
import Profile from "./pages/Profile.jsx"; // 其他页面
import {getCurrentUser, getUserInfo} from "./utils/token.js"
import AdminManagement from "./pages/AdminManage.jsx";
import CreateVote from "./pages/CreateVote.jsx";
import VoteList from "./pages/VoteList.jsx";
import VoteDetails from "./pages/VoteDetails.jsx";

const AppRoutes = () => {
    const [userInfo, setUserInfo] = useState(null)
    const [userState, setUserState] = useState(null)

    useEffect( () => {
        const fetchUserStatus = async () => {
            const ui = await getUserInfo(getCurrentUser())
            setUserInfo(ui)
            if (!ui) {
                setUserState("unverified")
            } else {
                setUserState(ui.state)
            }
        }
        fetchUserStatus();
    }, []);

    if (userState === null) {
        return <div>Loading...</div>
    }

    console.log("userInfo", userInfo);
    console.log("userState", userState);
    switch (userState) {
        case "":
        case "unverified":
            return (
                <Routes>
                    <Route path="/" element={<VoteList mode={"full"} />} />
                    <Route path="/init" element={<Init />} />
                    <Route path="/login" element={<Login title={"Login"} />} />
                    <Route path="/votes/all" element={<VoteList mode={"full"} />} />
                    <Route path="/votes/all/:pg" element={<VoteList mode={"full"} />} />
                    <Route path="*" element={<Login title={"Login"} />} />
                </Routes>
            );
        case "verified":
            return (
                <Routes>
                    <Route path="*" element={<Register />} />
                </Routes>
            );
        default:
            return (
                <Routes>
                    <Route path="/" element={<VoteList mode={"full"} />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/init" element={<Init />} />
                    <Route path="/login" element={<Login title={"Login"} />} />
                    <Route path="/switch" element={<Login title={"Switch User"} />} />
                    <Route path="/register" element={<Register />} />
                    {userInfo.role === "root" &&
                        <Route path="/admin-manage" element={<AdminManagement />} />}
                    {(userInfo.role === "root" || userInfo.role === "admin") &&
                        <Route path="/votes/create" element={<CreateVote />} />}
                    <Route path="/votes/all" element={<VoteList mode={"full"} />} />
                    <Route path="/votes/mine" element={<VoteList mode={"mine"} />} />
                    {(userInfo.role === "root" || userInfo.role === "admin") &&
                        <Route path="/votes/managed" element={<VoteList mode={"managed"} />} />}
                    <Route path="/votes/all/:pg" element={<VoteList mode={"full"} />} />
                    <Route path="/votes/mine/:pg" element={<VoteList mode={"mine"} />} />
                    {(userInfo.role === "root" || userInfo.role === "admin") &&
                        <Route path="/votes/managed/:pg" element={<VoteList mode={"managed"} />} />}
                    <Route path="/vote/:contract" element={<VoteDetails />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            );
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
            <Route path="/votes/all" element={<VoteList mode={"full"} />} />
            <Route path="/votes/mine" element={<VoteList mode={"mine"} />} />
            <Route path="/votes/managed" element={<VoteList mode={"managed"} />} />
            <Route path="/votes/all/:pg" element={<VoteList mode={"full"} />} />
            <Route path="/votes/mine/:pg" element={<VoteList mode={"mine"} />} />
            <Route path="/votes/managed/:pg" element={<VoteList mode={"managed"} />} />
            <Route path="/vote/:contract" element={<VoteDetails />} />
            <Route path="*" element={<NotFoundPage />} />
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