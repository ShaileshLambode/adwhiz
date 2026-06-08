import React, { useEffect, useState } from "react";
import axios from "axios";

const Navbar = () => {
  const [userName, setUserName] = useState("");
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BACKEND_URL}/api/user/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserName(res.data.LoginUserName);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="main-header-container sticky top-0 py-4 px-10 flex justify-between items-center bg-white shadow-md z-50">
      <div>
        <h1 className="text-lg font-semibold">Adwhiz</h1>
      </div>
      <div>
        <p className="text-lg">{userName || "Loading..."}</p>
      </div>
    </div>
  );
};

export default Navbar;
