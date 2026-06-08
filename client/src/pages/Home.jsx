import React, { useContext, useEffect, useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { RiDeleteBinLine } from "react-icons/ri";
import axios from 'axios';
import assets from '../assets/assets';
import { StoreContext } from '../Context/StoreContext';
import Menu from '../components/Menu';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import useScreenSize from '../hooks/useScreenSize';

const Home = () => {
  const { isModalOpen, setIsModalOpen,
    businesses, setBusinesses,
    post, setPost,
    isModal, setIsModal,
    postType, setPostType,
    tone, setTone,
    postDescription,
    businessName, setBusinessName } = useContext(StoreContext);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessAddress, setBusinessAddress] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoFiles, setLogoFiles] = useState(null);
  const [previewImages, setPreviewImages] = useState('');
  const [description, setDescription] = useState("");
  const [files, setFile] = useState(null);
  const [postName, setPostName] = useState("");
  const [selectedBusinessName, setSelectedBusinessName] = useState('');
  const [sector, setSector] = useState("")
  const [loading, setLoading] = useState(false);
  const [selectedLogoId, setSelectedLogoId] = useState('');
  const [error, setError] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const token = localStorage.getItem('token');
  const width = useScreenSize();

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



  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


  // Open modal for adding
  const openAddModal = () => {
    setBusinessName('');
    setBusinessAddress('');
    setLogoFile(null);
    setPreviewImage('');
    setIsEditMode(false);
    setSelectedBusiness(null);
    setIsModalOpen(true);
  };


  // Open modal for editing
  const openEditModal = (business) => {
    setBusinessName(business.name);
    setBusinessAddress(business.address);
    setPreviewImage(business.images?.url || '');
    setLogoFile(null);
    setIsEditMode(true);
    setSelectedBusiness(business);
    setIsModalOpen(true);
  };


  // Submit form: Logo add or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', businessName);
    formData.append('address', businessAddress);

    if (logoFile) {
      formData.append('image', logoFile);

      // If replacing image, send the public_id to be deleted
      if (isEditMode && selectedBusiness?.images?.public_id) {
        formData.append('removedImage', selectedBusiness.images.public_id);
      }
    }

    try {
      let response;
      if (isEditMode && selectedBusiness) {
        response = await axios.put(
          `${BACKEND_URL}/api/logo/update/${selectedBusiness._id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `${BACKEND_URL}/api/logo/add`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.data.success) {
        toast.success(`Business ${isEditMode ? 'updated' : 'added'} successfully!`);
        setIsModalOpen(false);
        setBusinessName('');
        setBusinessAddress('');
        setLogoFile(null);
        setPreviewImage('');
        fetchlogo();
      } else {
        toast.error(`Failed: ${response.data.message}`);
      }
    } catch (error) {
      toast.error('Something went wrong');
      console.error(error);
    }
  };


  const fetchlogo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/logo/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data.posts)) {
        setBusinesses(response.data.posts);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };


  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${BACKEND_URL}/api/logo/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Business deleted successfully");
        setBusinesses(prev => prev.filter(b => b._id !== id));
      } else {
        toast.error("Delete failed");
      }
    } catch (error) {
      toast.error("Error deleting");
    }
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


  useEffect(() => {
    fetchlogo();
  }, []);



  // Generate Post
  const handleSubmitpost = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedLogoId) {
      alert("Logo ID is missing.");
      setLoading(false);
      return;
    }

    const selectedLogoDoc = businesses.find((biz) => biz._id === selectedLogoId);

    if (!selectedLogoDoc || !selectedLogoDoc.images?.url) {
      alert("Selected logo is not valid.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("logo", selectedLogoId);
      formData.append("logoDoc", selectedLogoDoc.images.url);
      formData.append("postType", postType);
      formData.append("sector", sector);
      formData.append("tone", tone);
      formData.append("postName", postName);
      formData.append("description", description);

      // Add the image file to FormData
      if (backgroundImageUrl instanceof File) {
        formData.append("images", backgroundImageUrl);
      }

      const token = localStorage.getItem("token");

      const response = await axios.post(`${BACKEND_URL}/api/post/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201 && response?.data?.post?._id) {
        const newPost = response.data.post;

        const imageUrl = newPost?.props?.image;
        const backgroundImageUrl = newPost?.props?.backgroundImageUrl;

        handleCloseModalpost();
        await fetchPosts();

        navigate("/postReady", {
          state: {
            selectedPost: {
              _id: newPost._id,
              postType: newPost.postType || postType,
              tone: newPost.tone || tone,
              image: imageUrl,
              description: newPost.description || description,
              postName: newPost.postName || postName,
              sector: newPost.sector || sector,
              backgroundImageUrl: newPost.backgroundImageUrl || backgroundImageUrl
            },
          },
        })
      }
      console.log(backgroundImageUrl);
    } catch (err) {
      console.error("Error submitting post:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleCloseModalpost = () => {
    setIsModal(false);
    setPostName('');
    setSelectedBusinessName('');
    setDescription('');
    setLogoFiles(null);
    setPreviewImages(null);
    setPostType('');
    setSector('');
    setTone('');
  };

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/post/listpost`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && Array.isArray(response.data.posts)) {
        setPost(response.data.posts.map(post => ({
          ...post,
          favorite: post.favorite || false,
        })));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);


  const handleSingleDelete = (deletedId) => {
    setPost((prevPosts) => prevPosts.filter((p) => p._id !== deletedId));
  };


  let postsToShow = 4;
  if (width >= 768 && width < 1280) {
    postsToShow = 3; // md screen size only
  }

  return (
    <div className="bg-white px-4 py-8 sm:px-6 md:px-10 lg:px-20">

      {/* Logo Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Explore Business Posts</h2>
          <p className="text-gray-600 max-w-2xl mb-5">
            See how businesses turn ideas into engaging posts. Each one features unique branding elements like logos, names, and tailored visuals—all powered by AI.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white px-5 py-2 rounded-md font-semibold cursor-pointer"
        >
          Add Business
        </button>
      </div>


      {/* Logo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-6 mb-10">
        {businesses.map((biz) => (
          <div
            key={biz._id}
            className="rounded-xl shadow border border-gray-200 flex items-center gap-5 p-5 relative"
            style={{ backgroundImage: `url(${assets.bg})`, backgroundSize: 'cover' }}
          >
            {biz.images && (
              <img src={biz.images.url} alt={biz.name} className="w-20 h-20 object-cover" />
            )}
            <span className="font-semibold text-base sm:text-lg text-gray-800">{biz.name}</span>

            <button
              onClick={() => {
                setSelectedBusinessName(biz.name);
                setPostName(biz.name);
                setSelectedLogoId(biz._id);
                setIsModal(true);
              }}
              className="absolute top-3 right-3 bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white rounded-md p-1 cursor-pointer"
            >
              <FiPlus size={18} />
            </button>

            <div className="absolute flex gap-2 bottom-2 right-2 p-1 cursor-pointer">
              <FiEdit onClick={() => openEditModal(biz)} size={20} className="text-green-500" />
              <RiDeleteBinLine onClick={() => handleDelete(biz._id)} size={20} className="text-red-400" />
            </div>
          </div>
        ))}
      </div>


      {/* Generate Post Header */}
      <h2 className="text-2xl sm:text-3xl font-bold mb-2">Recently Created Posts</h2>
      <p className="text-gray-600 mb-5 max-w-2xl">Here are your latest AI-generated posts, ready to download and share across your social media channels. Stay consistent and keep your audience engaged effortlessly.</p>


      {/* Generate Post Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {post.slice(0, postsToShow).map((post, index) => (
          <div key={index}>
            <div className="p-5 relative flex flex-col border border-gray-200 rounded-md bg-[#F2F2F2]">
              <div className="absolute items-center top-0 right-0 flex gap-1 px-1 bg-white rounded-md border border-gray-200">
                <button
                  className="text-yellow-400 cursor-pointer"
                  onClick={() => toggleFavorite(post.id)}
                >
                  {post.favorite ? <FaStar size={15} /> : <FaRegStar size={15} className="text-black" />}
                </button>
                <p>|</p>
                <Menu selectedPost={post} index={index} onDelete={handleSingleDelete} />
              </div>
              <img src={post.props.image} alt={post.title} className="rounded-md h-40 sm:h-44 object-contain" />
            </div>
            <div className="flex-1 mt-3">
              <div className="text-md text-gray-800 font-semibold mb-1">{post.props.postName}</div>
              <div className="text-sm text-gray-500 mb-">{post.props.postType}</div>
            </div>
          </div>
        ))}
      </div>


      {/* Add Logo Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 backdrop-brightness-40 flex justify-center items-center z-50 px-2 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
              className="relative z-10 bg-white rounded-lg shadow-xl w-11/12 sm:w-full max-w-md sm:max-w-xl max-h-[90vh] flex flex-col"
            >
              {/* Close */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-4 bg-white rounded-full w-7 h-7 text-lg font-bold text-red-400 cursor-pointer">
                &times;
              </button>

              {/* Header */}
              <div className="bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] rounded-t-md py-4">
                <h1 className="text-2xl font-semibold text-white text-center">
                  {isEditMode ? 'Update Information' : 'Collect Information'}
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                <div className="mb-2">
                  <label className="block text-gray-700 mb-1 text-sm">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Name"
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-gray-700 mb-1 text-sm">Business Address</label>
                  <textarea
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Address"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-1 text-sm">Logo / Banner Image</label>
                  <div className="border border-gray-300 border-dashed rounded-md p-6 text-center text-sm">
                    <div className="flex flex-col items-center">
                      <img src={assets.upload} alt="upload" className="w-10 h-10 mb-2 opacity-70" />
                      <p className="text-gray-600 mb-2">Drag and drop or browse to upload</p>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setLogoFile(file);
                          setPreviewImage(URL.createObjectURL(file));
                        }}
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white px-6 py-2 rounded-md cursor-pointer"
                      >
                        Upload
                      </label>
                      <p className="text-sm text-gray-500 mt-2">Supported: JPG, PNG</p>
                      {previewImage && (
                        <img src={previewImage} alt="Preview" className="w-full max-h-20 object-contain" />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="text-white py-2 w-full rounded-md bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] cursor-pointer"
                >
                  {isEditMode ? 'Update Business' : 'Save Business Information'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Add Generate Post Model */}
      <AnimatePresence>
        {isModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-40 flex justify-center items-center lg:justify-start lg:items-start 2xl:justify-center 2xl:items-center lg:flex-none z-50 px-2 overflow-y-auto">

            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
              className="relative z-10 bg-white rounded-lg shadow-xl w-11/12 sm:w-full max-w-md sm:max-w-xl sm:mx-auto sm:my-10 sm:rounded-lg max-h-[90vh] flex flex-col">

              {/* Close Button */}
              <div className='flex items-center justify-center'>
                <button
                  onClick={handleCloseModalpost}
                  className="absolute top-3 right-4 bg-white rounded-full w-7 h-7 text-lg font-bold text-red-400 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Header */}
              <div className="bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] rounded-t-md py-4">
                <h1 className="text-2xl font-semibold text-white text-center">
                  Generate Post
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitpost} className='p-6 overflow-y-auto flex-1'>

                {/* Post Details Dropdown */}
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1 text-sm">Post Details</label>
                  <Select
                    options={postTypeOptions}
                    value={postTypeOptions.find(option => option.value === postType)}
                    onChange={(selectedOption) => setPostType(selectedOption.value)}
                    className="text-sm"
                    classNamePrefix="react-select"
                    isSearchable
                  />
                </div>

                {/* Tone Selection Dropdown */}
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1 text-sm">Tone Selection</label>
                  <Select
                    options={toneOptions}
                    value={toneOptions.find(option => option.value === tone)}
                    onChange={(selectedOption) => setTone(selectedOption.value)}
                    className="text-sm"
                    classNamePrefix="react-select"
                    isSearchable
                  />
                </div>

                {/* Business Name Input */}
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1 text-sm">Business Name</label>
                  <input
                    type="text"
                    value={postName} // bind value
                    onChange={(e) => {
                      setPostName(e.target.value);
                      setSelectedBusinessName(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none  focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter your business name"
                    required
                  />
                </div>

                {/* Sector Selection Dropdown */}
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1 text-sm">Sector</label>
                  <Select
                    options={sectorOptions}
                    value={sectorOptions.find(option => option.value === sector)}
                    onChange={(selectedOption) => setSector(selectedOption.value)}
                    className="w-full  border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                    classNamePrefix="react-select"
                    isSearchable
                  />
                </div>


                {/* Image */}
                <div className="mb-6">
                  <label className="block text-gray-700 mb-1 text-sm">Logo / Banner Image</label>
                  <div className="border border-gray-300 border-dashed rounded-md p-6 text-center text-sm">
                    <div className="flex flex-col items-center">
                      <img src={assets.upload} alt="upload" className="w-10 h-10 mb-2 opacity-70" />
                      <p className="text-gray-600 mb-2">Drag and drop or browse to upload</p>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setBackgroundImageUrl(file)
                          setPreviewImages(URL.createObjectURL(file));
                        }}
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-gradient-to-b from-[#ff9a9e] to-[#ff6666] text-white px-6 py-2 rounded-md cursor-pointer"
                      >
                        Upload
                      </label>
                      <p className="text-sm text-gray-500 mt-2">Supported: JPG, PNG</p>
                      {previewImages && (
                        <img src={previewImages} alt="Preview" className="w-full max-h-20 object-contain" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Post / Banner Description */}
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1 text-sm">Post / Banner Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Text here..."
                    required
                  />
                </div>

                {/* Generate Button */}
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
                    'Generate'
                  )}
                </button>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Home;