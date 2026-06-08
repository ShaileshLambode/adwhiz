import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import assets from "../assets/assets";
import { Link } from "react-router-dom";

const PasswordReset = () => {

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

            {/* Form container */}
            <div className="relative z-10 bg-white rounded-lg shadow-xl p-10 w-full max-w-lg">
                <h1 className="text-4xl font-semibold text-center text-gray-800 mb-2">
                    Password Reset
                </h1>
                <p className="text-center text-gray-600 text-sm">
                    Your password has been successfully reset.
                </p>
                <p className="text-center text-gray-600 mb-5 text-sm">
                    click continue to login with your updates password.
                </p>

                <Link to={"/"}>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white py-2 rounded-md  transition-colors duration-200 cursor-pointer"
                    >
                        Continue
                    </button>
                </Link>

                <div className="flex items-center mt-3 gap-2 justify-center text-sm text-gray-500">
                    <FaArrowLeft />
                    <a href="/">Back to login</a>
                </div>

            </div>
        </div>
    );
};

export default PasswordReset;

