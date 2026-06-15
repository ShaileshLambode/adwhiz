import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import Select from 'react-select';
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const PostReady = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const selectedPost = location.state?.selectedPost;

    const [postType, setPostType] = useState('');
    const [tone, setTone] = useState('custom');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [postName, setPostName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [sector, setSector] = useState("");
    const [previewImages, setPreviewImages] = useState('');
    const [loading, setLoading] = useState(false);
    // const [logoFile, setLogoFile] = useState(null);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');

    const postTypeOptions = [
    { value: '', label: 'Post / Banner Type', isDisabled: true },
    { value: '1024x1024', label: 'InstagramPost / SocialPostSquare' },
    { value: '1365x1024', label: 'MediumBanner / LandscapePost' },
    { value: '1024x1365', label: 'ReelPortrait / StoryMedium' },
    { value: '1536x1024', label: 'WideBanner / EventBanner' },
    { value: '1024x1536', label: 'StoryTall / ReelTall' },
    { value: '1820x1024', label: 'HeroBanner / WebsiteCoverLarge' },
    { value: '1024x1820', label: 'ReelLong / VerticalPoster' },
    { value: '1024x2048', label: 'ReelUltra / StoryMax' },
    { value: '2048x1024', label: 'UltraBanner / HomepageHeader' },
    { value: '1434x1024', label: 'StandardBanner / SocialCover' },
    { value: '1024x1434', label: 'ReelMediumTall / InstaStory' },
    { value: '1024x1280', label: 'VerticalPost / PortraitFeed' },
    { value: '1280x1024', label: 'MediumLandscapePost / ContentHeader' },
    { value: '1024x1707', label: 'ReelFullScreen / PortraitBanner' },
    { value: '1707x1024', label: 'WideLandscape / ConferenceBanner' },
  ];

    const toneOptions = [
        { value: '', label: 'Select Tone', isDisabled: true },
        { value: 'formal', label: 'Formal' },
        { value: 'casual', label: 'Casual' },
        { value: 'funny', label: 'Funny' }
    ];

    const sectorOptions = [
        { value: '', label: 'Sector Type', isDisabled: true },
        { value: 'E-commerce & Retail', label: 'E-commerce & Retail' },
        { value: 'Fashion & Apparel', label: 'Fashion & Apparel' },
        { value: 'Beauty & Personal Care', label: 'Beauty & Personal Care' },
        { value: 'Health & Wellness', label: 'Health & Wellness' },
        { value: 'Fitness & Nutrition', label: 'Fitness & Nutrition' },
        { value: 'Travel & Tourism', label: 'Travel & Tourism' },
        { value: 'Real Estate', label: 'Real Estate' },
        { value: 'Education & eLearning', label: 'Education & eLearning' },
        { value: 'Finance & Investment', label: 'Finance & Investment' },
        { value: 'Banking & Insurance', label: 'Banking & Insurance' },
        { value: 'Automobile & Transportation', label: 'Automobile & Transportation' },
        { value: 'Technology & Gadgets', label: 'Technology & Gadgets' },
        { value: 'Mobile Apps & SaaS', label: 'Mobile Apps & SaaS' },
        { value: 'Food & Beverage', label: 'Food & Beverage' },
        { value: 'Restaurants & Cafés', label: 'Restaurants & Cafés' },
        { value: 'Home Decor & Interior Design', label: 'Home Decor & Interior Design' },
        { value: 'Construction & Architecture', label: 'Construction & Architecture' },
        { value: 'Event Management', label: 'Event Management' },
        { value: 'Entertainment & Media', label: 'Entertainment & Media' },
        { value: 'Photography & Videography', label: 'Photography & Videography' },
        { value: 'Legal Services', label: 'Legal Services' },
        { value: 'Consulting & Coaching', label: 'Consulting & Coaching' },
        { value: 'Human Resources & Recruitment', label: 'Human Resources & Recruitment' },
        { value: 'Healthcare & Clinic', label: 'Healthcare & Clinic' },
        { value: 'Pet Care & Animal Services', label: 'Pet Care & Animal Services' },
        { value: 'Gaming & Esports', label: 'Gaming & Esports' },
        { value: 'Non-Profit & Social Causes', label: 'Non-Profit & Social Causes' },
        { value: 'Agriculture & Farming', label: 'Agriculture & Farming' },
        { value: 'Spirituality & Wellness Retreats', label: 'Spirituality & Wellness Retreats' },
        { value: 'Books & Publishing', label: 'Books & Publishing' }
    ];

    useEffect(() => {
        if (selectedPost) {
            const postData = selectedPost.props || selectedPost;
            setPostType(postData.postType);
            setTone(postData.tone);
            setImage(postData.image);
            setDescription(postData.description);
            setPostName(postData.postName);
            setSector(postData.sector);
            setBackgroundImageUrl(postData.backgroundImageUrl);
        }
    }, [selectedPost]);

    const openModal = (image) => {
        setModalImage(image);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalImage(null);
    };




    // Regenerate Post  
    const handleRegenerate = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
            alert("You are not logged in.");
            return;
        }

        if (!selectedPost || !selectedPost._id) {
            alert("Invalid post selected for regeneration.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("postType", postType);
            formData.append("tone", tone);
            formData.append("postName", postName);
            formData.append("description", description);
            formData.append("sector", sector);

            if (backgroundImageUrl instanceof File) {
                formData.append("images", backgroundImageUrl);
            }

            const response = await axios.put(
                `${BACKEND_URL}/api/post/regenerate/${selectedPost._id}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const updatedPost = response?.data?.post?.props.image;

            navigate("/postReady", {
                state: {
                    selectedPost: {
                        _id: response.data.post._id,
                        postType,
                        tone,
                        image: updatedPost,
                        description,
                        postName,
                        sector,
                        backgroundImageUrl,
                    },
                },
            });
            console.log(backgroundImageUrl);

        } catch (error) {
            console.error("Error regenerating post:", error?.response?.data || error.message);
            alert("Failed to regenerate post. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    // Download Post
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


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // setLogoFile(file);
            const imageUrl = URL.createObjectURL(file);
            setPreviewImages(imageUrl);
            setBackgroundImageUrl(imageUrl);
        }
    };

    if (!selectedPost) {
        return <div>No post selected.</div>;
    }

    return (
        <div className="bg-white px-4 py-8 sm:px-6 md:px-10 lg:px-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-5">Your post is ready!</h2>

            <div className="flex grid-cols-2 gap-15 flex-col lg:flex-row">

                {/* Preview Section */}
                <div className="w-full ">
                    <div className="p-5 flex flex-col items-center justify-center border border-gray-200 rounded-md bg-[#F2F2F2]">
                        {image && (
                            <img
                                src={image}
                                alt="logo"
                                className="rounded-md w-full h-149.5 object-contain"
                                onClick={() => openModal(image)}
                            />
                        )}
                    </div>

                    <div className="flex-1 mt-3">
                        <div className="text-md text-gray-800 font-semibold mb-1">{postName}</div>
                        <div className="text-sm text-gray-500 mb-2">{postType}</div>
                    </div>

                    <div className="flex gap-5">
                        <button className="w-full bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] cursor-pointer rounded text-md text-white py-2" onClick={() => handleDownload(selectedPost._id)}>
                            Download
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full border rounded cursor-pointer py-2"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>

                {/* Form Section */}
                <div className="w-full ">
                    <form onSubmit={handleRegenerate}>
                        <div className="mb-3">
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">Post Details</label>
                            <Select
                                options={postTypeOptions}
                                value={postTypeOptions.find(option => option.value === postType)}
                                onChange={(selectedOption) => setPostType(selectedOption.value)}
                                className="text-sm"
                                classNamePrefix="react-select"
                                isSearchable
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">Tone Selection</label>
                            <Select
                                options={toneOptions}
                                value={toneOptions.find(option => option.value === tone)}
                                onChange={(selectedOption) => setTone(selectedOption.value)}
                                className="text-sm"
                                classNamePrefix="react-select"
                                isSearchable
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">Business Name</label>
                            <input
                                type="text"
                                value={postName}
                                onChange={(e) => setPostName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-sm"
                                placeholder="Enter your business name"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">Sector</label>
                            <Select
                                options={sectorOptions}
                                value={sectorOptions.find(option => option.value === sector)}
                                onChange={(selectedOption) => setSector(selectedOption.value)}
                                className="text-sm"
                                classNamePrefix="react-select"
                                isSearchable
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">Logo / Banner Image</label>
                            <div className="border border-gray-300 border-dashed rounded-md p-6 text-center text-sm">
                                <div className="flex flex-col items-center">
                                    <img src={assets.upload} alt="upload" className="w-10 h-10 mb-2 opacity-70" />
                                    <p className="text-gray-600 mb-2">Drag and drop or browse to upload</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={handleFileChange}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white px-6 py-2 rounded-md cursor-pointer"
                                    >
                                        Upload
                                    </label>
                                    <p className="text-sm text-gray-500 mt-2">Supported: JPG, PNG</p>

                                    {previewImages ? (
                                        <img src={previewImages} alt="Preview" className="w-full max-h-20 object-contain mt-2" />
                                    ) : backgroundImageUrl ? (
                                        <img src={backgroundImageUrl} alt="Default" className="w-full max-h-20 object-contain mt-2" />
                                    ) : (
                                        <img src="https://png.pngtree.com/png-vector/20190508/ourmid/pngtree-upload-cloud-vector-icon-png-image_1027251.jpg" alt="Upload Icon" className="w-full max-h-20 object-contain mt-2 opacity-70" />
                                    )}
                                </div>
                            </div>
                        </div>


                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">Post / Banner Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-sm"
                                placeholder="Text here..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`relative overflow-hidden text-white py-2 w-full rounded-md transition-colors duration-200 text-sm ${postName && description
                                ? 'bg-gradient-to-b from-[#ff9a9e] to-[#ff6666]'
                                : 'bg-gray-300 cursor-not-allowed'
                                } cursor-pointer`}
                            disabled={!postName || !description || loading}
                        >
                            {loading ? (
                                <>
                                    <div className="absolute inset-0 bar-fill" />
                                    <span className="relative z-10 text-sm">Loading...</span>
                                </>
                            ) : (
                                ' Regenerate'
                            )}
                        </button>
                    </form>
                </div>

            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 backdrop-brightness-40 flex justify-center items-center z-50">
                    <div className="relative w-145 h-145 bg-gray-100 p-4 sm:p-6 md:p-10 border rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                            src={modalImage}
                            alt="Full screen"
                            className="object-contain"
                        />
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 w-10 h-10 p-2 text-white bg-red-500 hover:bg-red-600 rounded-full cursor-pointer text-lg font-bold"
                        >
                            X
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostReady;
