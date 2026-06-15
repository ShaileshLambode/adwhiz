import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";
import assets from "../assets/assets";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CheckYourEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: location.state?.email || "" });
    const email = location.state?.email || "your email";
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(`${BACKEND_URL}/api/user/fpassword`, { email: formData.email })
            .then(res => {
                if (res.data.Status === "Success") {
                    toast.success("Password reset link sent!");
                    navigate('/checkYourEmail', { state: { email: formData.email } });
                } else {
                    toast.error(res.data.Status || "Error occurred");
                }
            })
            .catch(err => {
                console.error(err);
                toast.error("Server error. Try again later.");
            });
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Background gradient + image */}
            <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                    backgroundImage: `linear-gradient(to bottom, #F8AD9D, #FF6666), url(${assets.login1})`,
                    backgroundBlendMode: "overlay",
                }}
            />

            {/* Forgot Password Form */}
            <div className="relative z-10 bg-white rounded-lg shadow-xl p-10 w-full max-w-lg">
                <h1 className="text-4xl font-semibold text-center text-gray-800 mb-2">
                    Check Your Email
                </h1>
                <p className="text-center text-gray-600 text-sm">
                    We sent a password reset link to
                </p>
                <p className="text-center text-gray-600 mb-5 text-lg">{email}</p>

                <p className="flex text-gray-400 text-sm items-center justify-center mt-3">
                    Didn’t receive the email?
                    <span
                        className="text-red-400 ml-1 cursor-pointer"
                        onClick={handleSubmit}
                    >
                        Click to resend
                    </span>
                </p>

                <div className="flex items-center mt-3 gap-2 justify-center text-sm text-gray-500">
                    <FaArrowLeft />
                    <Link to="/">Back to login</Link>
                </div>
            </div>

            {/* Toast container */}
            <ToastContainer position="top-center" />
        </div>
    );
};

export default CheckYourEmail;
