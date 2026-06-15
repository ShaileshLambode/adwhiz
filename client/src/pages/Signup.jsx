import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        rememberMe: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });

        if (name === "password") {
            setPasswordError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

        if (!strongPasswordRegex.test(formData.password)) {
            setPasswordError("Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        try {
            const response = await axios.post(`${BACKEND_URL}/api/user/signup`, {
                name: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
            });

            const token = response.data.token;

            if (token) {
                localStorage.setItem("token", token);
            }

            navigate("/collectInformation");
        } catch (error) {
            console.error("Signup error:", error);
            toast.error(error.response?.data?.message || "An error occurred during signup.");
        }
    };

    const handleGoogleCallback = async (credentialResponse) => {
        try {
            const token = credentialResponse.credential;
            if (!token) throw new Error("Google token not found");

            const res = await axios.post(`${BACKEND_URL}/api/user/google-auth`, {
                token: token,
            });

            localStorage.setItem("token", res.data.token);
            toast.success("Google Signup successful!");
            navigate("/collectInformation");
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            toast.error(message === "User already exists" ? "User already exists with this email." : `Google Signup failed: ${message}`);
        }
    };

    useEffect(() => {
        if (window.google && GOOGLE_CLIENT_ID) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
            });

            window.google.accounts.id.renderButton(
                document.getElementById("googleSignUpDiv"),
                {
                    theme: "outline",
                    size: "large",
                    type: "standard",
                    shape: "pill",
                    logo_alignment: "center",
                }
            );

            window.google.accounts.id.prompt();
        }
    }, []);

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
                <h1 className="text-4xl font-semibold text-center text-gray-800 mb-2">Create Account</h1>
                <p className="text-center text-gray-600 mb-5 text-sm">Please enter your details to sign up.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                            placeholder="Username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                            placeholder="Email"
                            required
                        />
                    </div>

                    <div>
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
                        {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
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

                    <div className="flex items-center text-sm text-gray-600">
                        <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                            className="h-4 w-4 mr-2 border-gray-300 rounded"
                        />
                        <p>
                            By signing up, you accept our{" "}
                            <span className="text-red-400">Terms & Conditions</span> and{" "}
                            <span className="text-red-400">Privacy Policy</span>
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white py-2 rounded-md transition-colors duration-200 cursor-pointer mb-3"
                    >
                        Sign Up
                    </button>

                    <div className="relative flex items-center justify-center text-sm text-gray-500 mb-3">
                        <div className="border-t border-gray-300 flex-grow" />
                        <span className="px-4">or continue with</span>
                        <div className="border-t border-gray-300 flex-grow" />
                    </div>

                    <div className="flex">
                        <div id="googleSignUpDiv" className="max-w rounded-lg" />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
