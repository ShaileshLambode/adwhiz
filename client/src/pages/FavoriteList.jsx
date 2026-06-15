import React, { useContext, useEffect, useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { StoreContext } from '../Context/StoreContext';
import Menu from '../components/Menu';
import axios from 'axios';


const FavoriteList = () => {
    const { setPost } = useContext(StoreContext);
    const [selectedPosts, setSelectedPosts] = useState([]);
    const [post, setLocalPost] = useState([]);
    const token = localStorage.getItem('token');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // Fetch favorite posts on mount
    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${BACKEND_URL}/api/post/favorites`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setPost(response.data.favorites);
                setLocalPost(response.data.favorites);
            } catch (error) {
                console.error('Error fetching favorite posts:', error);
            }
        };

        fetchFavorites();
    }, [setPost]);

    const handleSingleDelete = (deletedId) => {
        setPost((prevPosts) => prevPosts.filter((p) => p._id !== deletedId));
        setLocalPost((prevPosts) => prevPosts.filter((p) => p._id !== deletedId));
    };

    const toggleFavorite = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${BACKEND_URL}/api/post/favoritetoggle/${id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Remove post from list if unfavorited
            setPost((prevPosts) =>
                prevPosts.filter((p) => p._id !== id)
            );
            setLocalPost((prevPosts) =>
                prevPosts.filter((p) => p._id !== id)
            );

        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };



    return (
        <div className="bg-white px-4 py-8 sm:px-6 md:px-10 lg:px-20">
            <div className="flex flex-col mb-4 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Favorite List</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {post.map((post, index) => (
                    <div key={index}>
                        <div className="p-5 relative flex flex-col border border-gray-200 rounded-md bg-[#F2F2F2]">
                            {/* Menu and Favorite Toggle */}
                            <div className="absolute items-center top-1 right-1 flex gap-1 px-1 bg-white rounded-md border border-gray-200">
                                <button
                                    className="text-yellow-400 cursor-pointer"
                                    onClick={() => toggleFavorite(post._id)}
                                >
                                    {post.favorite ? <FaStar size={15} /> : <FaRegStar size={15} className="text-black" />}
                                </button>
                                <p>|</p>
                                <Menu selectedPost={post} index={index} onDelete={handleSingleDelete} />
                            </div>

                            {/* Image */}
                            <img src={post.props.image} alt={post.title} className="rounded-md h-40 sm:h-44 object-contain" />
                        </div>

                        <div className="flex-1 mt-3">
                            <div className="text-md text-gray-800 font-semibold mb-1">{post.props.postName}</div>
                            <div className="text-sm text-gray-500 mb-2">{post.props.postType}</div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default FavoriteList;
