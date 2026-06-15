import { createContext, useState, useEffect } from "react";
export const StoreContext = createContext();
import assets from '../assets/assets';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

export const ShopContextProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizAddress, setNewBizAddress] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [logoURL, setLogoURL] = useState('');
  const [businesses, setBusinesses] = useState([]);

  const [isModal, setIsModal] = useState(false);
  const [post, setPost] = useState([]);
  const [postType, setPostType] = useState('');
  const [tone, setTone] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [businessName, setBusinessName] = useState("");
  const [editingPost, setEditingPost] = useState(null);
 

  const handleRegeneratePost = (post) => {
    setEditingPost(post);
    setPostType(post.postType);
    setTone(post.tone);
    setLogoURL(post.logoURL);
    setPostDescription(post.postDescription);
    setBusinessName(post.businessName);
    setSelectedImage(null);
  };


  const contextValue = {
    isModalOpen, setIsModalOpen,
    businesses, setBusinesses,
    newBizName, setNewBizName,
    newBizAddress, setNewBizAddress,
    logoURL, setLogoURL,
    selectedImage, setSelectedImage,
    post, setPost,
    isModal, setIsModal,
    postType, setPostType,
    tone, setTone,
    postDescription, setPostDescription,
    businessName, setBusinessName,
    editingPost, setEditingPost,
    handleRegeneratePost,
  };


  return (
    <StoreContext.Provider value={contextValue}>
      {children}

    </StoreContext.Provider>
  );
};