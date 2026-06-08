import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { RiDeleteBinLine } from "react-icons/ri";
import { FiDownload } from "react-icons/fi";
import axios from 'axios';
import { toast } from 'react-toastify';

const PromoGallery = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BACKEND_URL}/api/promo/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPromos(res.data.promoPosts || []);
      } catch (err) {
        console.error("Error fetching promos:", err);
        setError("Failed to load promotional posts.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPromos();
    } else {
      setError("User not authenticated.");
    }
  }, [BACKEND_URL, token]);

  const toggleFavorite = async (id) => {
    try {
      // Optimistic state update
      setPromos(prev => prev.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
      
      const res = await axios.patch(`${BACKEND_URL}/api/promo/favorite/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(res.data.message || "Favorite updated!");
    } catch (err) {
      console.error("Error toggling favorite:", err);
      // Revert optimistic update
      setPromos(prev => prev.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
      toast.error("Failed to update favorite status.");
    }
  };

  const handleDownload = async (id, occasion) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/promo/download/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download image");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `promo_${occasion || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Image download error:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promotional banner?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/promo/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromos(prev => prev.filter(p => p.id !== id));
      toast.success("Promo banner deleted successfully.");
    } catch (err) {
      console.error("Error deleting promo:", err);
      toast.error("Failed to delete banner.");
    }
  };

  return (
    <div className="bg-white px-4 py-8 sm:px-6 md:px-10 lg:px-20">
      <div className="flex flex-col mb-8 gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Promotional & Festival Banners</h2>
        <p className="text-gray-600 max-w-2xl">
          Browse and manage your AI-generated festival posters. Designed using advanced Recraft V3 text layouts and custom branding.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6666]"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 font-medium">{error}</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 max-w-lg mx-auto">
          <p className="text-gray-500 mb-6 font-medium">You haven't generated any festival promo posters yet.</p>
          <a
            href="/promo-creator"
            className="px-6 py-3 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white rounded-lg font-bold shadow hover:opacity-90 transition-all cursor-pointer"
          >
            Create Your First Banner
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {promos.map((promo) => (
            <div key={promo.id} className="group relative flex flex-col border border-gray-200 rounded-xl bg-gray-50 overflow-hidden hover:shadow-md transition-all">
              
              {/* Image Preview Container */}
              <div className="p-4 bg-gray-100 flex items-center justify-center relative aspect-square overflow-hidden border-b border-gray-200">
                <img 
                  src={promo.generatedImageUrl} 
                  alt={promo.template?.name || "Promo Poster"} 
                  className="rounded-lg max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                />
                
                {/* Actions overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <button
                    className="text-yellow-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    onClick={() => toggleFavorite(promo.id)}
                    title={promo.favorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    {promo.favorite ? <FaStar size={16} /> : <FaRegStar size={16} className="text-gray-500" />}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => handleDownload(promo.id, promo.occasion)}
                    className="text-gray-600 hover:text-[#FF6666] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Download Poster"
                  >
                    <FiDownload size={16} />
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    className="text-gray-600 hover:text-red-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    onClick={() => handleDelete(promo.id)}
                    title="Delete Poster"
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-bold text-gray-800 line-clamp-1">{promo.template?.name || "Festival Banner"}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                      {promo.occasion?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{promo.size}</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mt-4">
                  Created {new Date(promo.createdAt).toLocaleDateString()}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoGallery;
