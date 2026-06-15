import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import assets from "../assets/assets";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const SetNewPassword = () => {
    const [formData, setFormData] = useState({
        password: "",
        confirmpassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { id, token } = useParams();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const isStrongPassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        return regex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const { password, confirmpassword } = formData;

        if (password !== confirmpassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!isStrongPassword(password)) {
            setError(
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            );
            return;
        }

        try {
            const res = await axios.post(
                `${BACKEND_URL}/api/user/changepassword/${id}/${token}`,
                { password }
            );

            if (res.data.Status === "Success") {
                setSuccess("Password changed successfully!");
                navigate("/passwordReset");
            } else {
                setError(res.data.Message || res.data.Status || "Failed to change password.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        }
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
                    Set New Password
                </h1>
                <p className="text-center text-gray-600 text-sm">
                    Your new password must be different
                </p>
                <p className="text-center text-gray-600 mb-5 text-sm">
                    from previously used passwords.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {success && <p className="text-green-500 text-sm">{success}</p>}

                    {/* Password Field */}
                    <div className="mb-2">
                        <label className="block text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                                placeholder="Password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        {formData.password && !isStrongPassword(formData.password) && (
                            <p className="text-red-500 text-sm mt-1">
                                Must be at least 8 characters with uppercase, lowercase, number & special character.
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label className="block text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmpassword"
                                value={formData.confirmpassword}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                                placeholder="Confirm Password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white py-2 rounded-md transition-colors duration-200 cursor-pointer"
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

export default SetNewPassword;
