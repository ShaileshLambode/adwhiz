import React, { useContext, useEffect, useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { StoreContext } from '../Context/StoreContext';
import Menu from '../components/Menu';
import { RiDeleteBinLine } from "react-icons/ri";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GeneratedContent = () => {
    const { post, setPost } = useContext(StoreContext);
    const [selectedPosts, setSelectedPosts] = useState([]);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token'); 

    // Fetch posts from API
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${BACKEND_URL}/api/post/listpost`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data?.posts && Array.isArray(response.data.posts)) {
                    const postsWithFavorites = response.data.posts.map(post => ({
                        ...post,
                        favorite: post.favorite || false,
                    }));
                    setPost(postsWithFavorites);
                } else {
                    console.warn("Unexpected response format:", response.data);
                    setError("No posts found.");
                }
            } catch (error) {
                console.error("Error fetching posts:", error);
                setError("Failed to load posts");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPosts();
        } else {
            setError("User not authenticated");
        }
    }, [BACKEND_URL, token, setPost]);


    const toggleSelectPost = (id) => {
        setSelectedPosts((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const toggleFavorite = async (id) => {
        try {
            // Optimistic UI update
            setPost((prevPosts) =>
                prevPosts.map((p) =>
                    p.id === id ? { ...p, favorite: !p.favorite } : p
                )
            );

            // API call to toggle favorite on backend
            await axios.patch(`${BACKEND_URL}/api/post/favoritetoggle/${id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Failed to toggle favorite:", error);

            // Optional: revert optimistic update on error
            setPost((prevPosts) =>
                prevPosts.map((p) =>
                    p.id === id ? { ...p, favorite: !p.favorite } : p
                )
            );

            toast.error("Could not update favorite status. Try again.");
        }
    };


    const deleteSelectedPosts = async () => {
        try {
            for (const postId of selectedPosts) {
                await axios.delete(`${BACKEND_URL}/api/post/delete/${postId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            setPost((prevPosts) => prevPosts.filter((p) => !selectedPosts.includes(p.id)));
            setSelectedPosts([]);

            toast.success("Selected image(s) deleted successfully");
        } catch (error) {
            console.error("Failed to delete posts:", error);
            toast.error("Something went wrong while deleting.");
        }
    };


    const handleSingleDelete = (deletedId) => {
        setPost((prevPosts) => prevPosts.filter((p) => p._id !== deletedId));
    };


    return (
        <div className="bg-white px-4 py-8 sm:px-6 md:px-10 lg:px-20">
            <div className="flex flex-col mb-4 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Recently Created Posts</h2>
                <p className="text-gray-600 max-w-2xl mb-5">
                    Here are your latest AI-generated posts, ready to download and share across your social media channels. Stay consistent and keep your audience engaged effortlessly.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {post.map((post, index) => (
                    <div key={index}>

                        <div className="p-5 relative flex flex-col border border-gray-200 rounded-md bg-[#F2F2F2]">

                            <div className="absolute top-1 left-1">
                                <label className="relative cursor-pointer w-5 h-5">
                                    <input
                                        type="checkbox"
                                        className="peer absolute top-0 opacity-0 w-5 h-5 z-10 cursor-pointer bg-white"
                                        checked={selectedPosts.includes(post.id)}
                                        onChange={() => toggleSelectPost(post.id)}
                                    />
                                    <span className="w-5 h-5 block rounded border border-gray-400 bg-white peer-checked:bg-gradient-to-b peer-checked:from-[#ff9a9e] peer-checked:to-[#ff6666] peer-checked:border-transparent transition-all duration-200"></span>
                                    <svg
                                        className="absolute top-[2px] left-[2px] w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </label>
                            </div>


                            <div className="absolute items-center top-1 right-1 flex gap-1 px-1 bg-white rounded-md border border-gray-200">
                                <button
                                    className="text-yellow-400 cursor-pointer"
                                    onClick={() => toggleFavorite(post.id)}
                                >
                                    {post.favorite ? <FaStar size={15} /> : <FaRegStar size={15} className="text-black" />}
                                </button>
                                <p>|</p>
                                <Menu selectedPost={post} index={index} totalCols={4} onDelete={handleSingleDelete} />
                            </div>

                            <img src={post.props.image} alt={post.title} className="rounded-md h-40 sm:h-44 object-contain" />
                        </div>

                        <div className="flex-1 mt-3">
                            <div className="text-md text-gray-800 font-semibold mb-1">{post.props.postName}</div>
                            <div className="text-sm text-gray-500 mb-2">{post.props.postType}</div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedPosts.length > 0 && (
                <div className="flex justify-between items-center gap-6 mt-5 border w-3xs p-4 border-gray-200 rounded mx-auto">
                    <p className="text-sm text-gray-600">{selectedPosts.length} selected</p>
                    <button onClick={deleteSelectedPosts} className="cursor-pointer">
                        <RiDeleteBinLine className="text-red-500 text-xl" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default GeneratedContent;
