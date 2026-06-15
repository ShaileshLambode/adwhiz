import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import axios from "axios";
import { toast } from 'react-toastify';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home");

    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleLoginSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            logo_alignment: "center",
          }
        );
      } else {
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();
  }, [navigate]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BACKEND_URL}/api/user/login`, {
        email: formData.username,
        password: formData.password,
      });
      const { token } = response.data;
      localStorage.setItem("token", token);
      toast.success("Login successful!");
      navigate("/home");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.");
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      if (!token) throw new Error("Google token not found");

      const res = await axios.post(`${BACKEND_URL}/api/user/google-login`, {
        token: token,
      });

      localStorage.setItem("token", res.data.token);
      toast.success("Google login successful!");
      navigate("/home");
    } catch (err) {
      toast.error("Google login failed: " + err.message);
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
        <h1 className="text-4xl font-semibold text-center text-gray-800 mb-2">Login</h1>
        <p className="text-center text-gray-600 mb-5 text-sm">
          Please enter your login details to log in.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-1">UserEmail</label>
            <input
              type="email"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
              placeholder="UserEmail"
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
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 mr-2"
              />
              Remember Me
            </label>
            <a href="/forgotpassword" className="text-sm text-gray-700">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white py-2 rounded-md cursor-pointer"
          >
            Login
          </button>

          <div className="relative flex items-center justify-center text-sm text-gray-500 mb-3">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="px-4">or continue with</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>

          <div id="google-signin-button"></div>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?
            <a href="/signup" className="text-gray-700 font-semibold ml-1">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
