import React, { useState, useRef, useEffect } from 'react';
import { FiMoreHorizontal, FiDownload, FiShare2, FiEdit } from 'react-icons/fi';
import { RiDeleteBinLine } from "react-icons/ri";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import assets from '../assets/assets';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Menu = ({ selectedPost, onDelete, index }) => {
    const [open, setOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
                setShareOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/post/delete/${selectedPost?._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (onDelete) {
                onDelete(selectedPost._id); // Notify parent
            }

            toast.success("Post deleted successfully!");
            setOpen(false);
        } catch (error) {
            console.error("Failed to delete post:", error);
            toast.error("Failed to delete post.");
        }
    };

    const handleDownload = async (postId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/post/download/${postId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to download image");

            const blob = await response.blob();

            const disposition = response.headers.get("Content-Disposition");
            let fileName = "downloaded_image";
            if (disposition && disposition.includes("filename=")) {
                fileName = disposition.split("filename=")[1].replace(/"/g, "");
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Image download error:", error);
        }
    };

    const shareOptions = [
        {
            icon: assets.share4,
            onClick: () => {
                const imageUrl = selectedPost.props?.image;
                const text = `${imageUrl}`;
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            }
        },
        {
            icon: assets.share5,
            onClick: () => {
                const imageUrl = selectedPost.props?.image;
                const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent("Check out this post!")}`;
                window.open(tgUrl, '_blank');
            }
        },
        {
            icon: assets.share6,
            onClick: () => {
                const imageUrl = selectedPost.props?.image;
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(imageUrl)}`;
                window.open(twitterUrl, '_blank');
            }
        },
        {
            icon: assets.share7,
            onClick: () => {
                const imageUrl = selectedPost.props?.image;
                const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}`;
                window.open(linkedInUrl, '_blank');
            }
        },
        {
            icon: assets.share3,
            onClick: () => {
                const subject = "Check out this post";
                const body = `Hey,\n\nTake a look at this post:\n${import.meta.env.VITE_FRONTEND_URL}/post/${selectedPost._id}`;
                const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(mailtoLink, '_self');
            }
        },
        {
            icon: assets.share1,
        },
        {
            icon: assets.share2,
            onClick: () => {
                const url = `${import.meta.env.VITE_FRONTEND_URL}/post/${selectedPost._id}`;
                const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                window.open(fbShareUrl, '_blank');
            }
        }
    ];

    const getMenuPosition = (index) => {
        const base = 'right-0';
        const sm = (index % 2 !== 1) ? 'sm:translate-x-[190px]' : 'sm:translate-x-[-10px]';
        const md = (index % 3 !== 2) ? 'md:translate-x-[200px]' : 'md:translate-x-[-10px]';
        const xl = (index % 4 !== 3) ? 'xl:translate-x-[190px]' : 'xl:translate-x-[-20px]';
        return `${base} ${sm} ${md} ${xl}`;
    };


    return (
        <div className="relative inline-block items-center" ref={menuRef}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer"
            >
                <FiMoreHorizontal size={22} />
            </button>

            {open && (
                <div className={`absolute ${getMenuPosition(index)} mt-2 w-56 bg-white rounded-xl shadow-lg z-50 py-2`}>

                    <Link to="/postReady" state={{ selectedPost }}>
                        <button className="flex items-center w-full px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-100">
                            <FiEdit className="mr-3" /> Regenerate Post
                        </button>
                    </Link>

                    <button
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleDownload(selectedPost._id)}
                    >
                        <FiDownload className="mr-3" /> Download
                    </button>

                    <button
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setShareOpen((prev) => !prev)}
                        type="button"
                    >
                        <FiShare2 className="mr-3" /> Share
                        <span className="ml-auto">
                            {shareOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                    </button>

                    {shareOpen && (
                        <div className="grid grid-cols-5 gap-2 py-3 px-4">
                            {shareOptions.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={item.onClick}
                                    className="flex items-center justify-center cursor-pointer m-1"
                                >
                                    <img src={item.icon} className="w-7 h-7" alt={`share-${idx}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleDelete}
                        className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <RiDeleteBinLine className="mr-3" /> Move To Trash
                    </button>

                </div>
            )}
        </div>
    );
};

export default Menu;
