import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import assets from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";


const ForgotPassword = () => {
    const [formData, setFormData] = useState({ email: "" });
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const handleChange = (e) => {
        setFormData({ ...formData, email: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(`${BACKEND_URL}/api/user/fpassword`, { email: formData.email })
            .then(res => {
                if (res.data.Status === "Success") {
                    navigate('/checkYourEmail',{ state: { email: formData.email } });
                } else {
                    alert(res.data.Status || "Error occurred");
                }
            })
            .catch(err => {
                console.log(err);
                alert("Server error. Try again later.");
            });
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                    backgroundImage: `linear-gradient(to bottom, #F8AD9D, #FF6666), url(${assets.login1})`,
                    backgroundBlendMode: "overlay",
                }}
            />

            <div className="relative z-10 bg-white rounded-lg shadow-xl p-10 w-full max-w-lg">
                <h1 className="text-4xl font-semibold text-center text-gray-800 mb-2">
                    Forgot Password?
                </h1>
                <p className="text-center text-gray-600 mb-5 text-sm">
                    No worries, we’ll send you reset instructions.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="mb-3">
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white py-2 rounded-md transition duration-200 cursor-pointer"
                    >
                        Reset Password
                    </button>

                    <div className="flex items-center mt-3 gap-2 justify-center text-sm text-gray-500">
                        <FaArrowLeft />
                        <Link to="/">Back to login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
