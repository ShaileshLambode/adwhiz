import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import assets from "../assets/assets";

const SideBar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <>
            {/* Sidebar - Desktop */}
            <div
                className="hidden lg:flex w-64 app-sidebar sticky top-0 left-0 h-screen text-white p-5 flex-col justify-between"
                style={{ background: "linear-gradient(to bottom, #F8AD9D, #FF6666)" }}
            >
                <div>
                    <div className="flex items-center justify-center mb-12">
                        <img src={assets.logo3} alt="" className="w-15" />
                    </div>

                    <NavLink to="/home" className="flex items-center gap-3 text-md p-3">
                        All Business
                    </NavLink>

                    <NavLink to="/generatedcontent" className="flex items-center gap-3 text-md p-3">
                        Generated Content
                    </NavLink>

                    <NavLink to="/promo-creator" className="flex items-center gap-3 text-md p-3">
                        Promo Creator
                    </NavLink>

                    <NavLink to="/promo-gallery" className="flex items-center gap-3 text-md p-3">
                        Promo Gallery
                    </NavLink>

                    <NavLink to="/favoritelist" className="flex items-center gap-3 text-md p-3">
                        Favorite List
                    </NavLink>
                </div>

                <button
                    onClick={handleLogout}
                    className="mt-auto w-full text-left flex items-center gap-3 text-md p-3 cursor-pointer"
                >
                    <img src={assets.group3} alt="" className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* Mobile Logout Button */}
            <div className="fixed bottom-0 w-full px-4 z-50 lg:hidden">
                <div className="flex justify-between items-center bg-[#FAF9F6] shadow-xl p-1 rounded-full mx-auto max-w-sm">

                    <Link to="/home">
                        <button
                            className="text-white p-3 rounded-full shadow-md"
                            style={{ backgroundColor: '#FF6666' }}
                        >
                            <img src={assets.group1} alt="" className="w-3 h-3" />
                        </button>
                    </Link>

                    <Link to="/generatedcontent">
                        <button
                            className="text-white p-3 rounded-full shadow-md"
                            style={{ backgroundColor: '#FF6666' }}
                        >
                            <img src={assets.group} alt="" className="w-3 h-3" />
                        </button>
                    </Link>

                    <Link to="/favoritelist">
                        <button
                            className="text-white p-3 rounded-full shadow-md"
                            style={{ backgroundColor: '#FF6666' }}
                        >
                            <img src={assets.group22} alt="" className="w-3 h-3" />
                        </button>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="text-white p-3 rounded-full shadow-md"
                        style={{ backgroundColor: '#FF6666' }}
                    >
                        <img src={assets.group3} alt="" className="w-3 h-3" />
                    </button>

                </div>
            </div>
        </>
    );
};

export default SideBar;
