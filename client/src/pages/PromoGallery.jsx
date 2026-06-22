import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaInstagram } from 'react-icons/fa';
import { RiDeleteBinLine } from "react-icons/ri";
import { FiDownload } from "react-icons/fi";
import axios from 'axios';
import { toast } from 'react-toastify';
import PublishModal from '../components/PublishModal';

const PromoGallery = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');
  const [promos, setPromos] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePublishPost, setActivePublishPost] = useState(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch all three types in parallel
        const [promoRes, quoteRes, offerRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/promo/list`, { headers }),
          axios.get(`${BACKEND_URL}/api/quote/list`, { headers }),
          axios.get(`${BACKEND_URL}/api/offer/list`, { headers })
        ]);

        const fetchedPromos = (promoRes.data.promoPosts || []).map(p => ({
          ...p,
          id: p.id || p._id,
          type: 'festival'
        }));

        const fetchedQuotes = (quoteRes.data.posts || []).map(q => ({
          ...q,
          id: q.id || q._id,
          type: 'quote'
        }));

        const fetchedOffers = (offerRes.data.posts || []).map(o => ({
          ...o,
          id: o.id || o._id,
          type: 'offer'
        }));

        // Combine and sort by createdAt descending
        const combined = [...fetchedPromos, ...fetchedQuotes, ...fetchedOffers].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setPromos(combined);
      } catch (err) {
        console.error("Error fetching promotional gallery content:", err);
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

  const toggleFavorite = async (id, type) => {
    try {
      // Optimistic state update
      setPromos(prev => prev.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
      
      const endpoint = type === 'festival' ? 'promo' : type === 'quote' ? 'quote' : 'offer';
      const res = await axios.patch(`${BACKEND_URL}/api/${endpoint}/favorite/${id}`, {}, {
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

  const handleDownload = async (id, type, occasionOrThemeOrHeadline) => {
    try {
      const endpoint = type === 'festival' ? 'promo' : type === 'quote' ? 'quote' : 'offer';
      const response = await fetch(`${BACKEND_URL}/api/${endpoint}/download/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download image");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_${occasionOrThemeOrHeadline || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Image download error:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDelete = async (id, type) => {
    const postTypeName = type === 'festival' ? 'festival promo banner' : type === 'quote' ? 'quote post' : 'offer post';
    if (!window.confirm(`Are you sure you want to delete this ${postTypeName}?`)) return;
    try {
      const endpoint = type === 'festival' ? 'promo' : type === 'quote' ? 'quote' : 'offer';
      await axios.delete(`${BACKEND_URL}/api/${endpoint}/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromos(prev => prev.filter(p => p.id !== id));
      toast.success("Post deleted successfully.");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete banner.");
    }
  };

  const filteredPromos = promos.filter(p => filterType === 'all' || p.type === filterType);

  const getPostTitle = (promo) => {
    if (promo.type === 'festival') {
      return promo.template?.name || "Festival Banner";
    }
    if (promo.type === 'quote') {
      return promo.theme ? `Quote: ${promo.theme}` : "Quote Post";
    }
    if (promo.type === 'offer') {
      return promo.offerHeadline || "Offer Post";
    }
    return "Promotional Post";
  };

  const getPostTagline = (promo) => {
    if (promo.type === 'festival') {
      return promo.occasion?.replace('_', ' ');
    }
    if (promo.type === 'quote') {
      return promo.tone;
    }
    if (promo.type === 'offer') {
      return promo.validity || 'Limited Time';
    }
    return '';
  };

  const getPostDownloadName = (promo) => {
    if (promo.type === 'festival') return promo.occasion;
    if (promo.type === 'quote') return promo.theme;
    if (promo.type === 'offer') return promo.offerHeadline;
    return 'image';
  };

  return (
    <div className="bg-white px-4 py-8 sm:px-6 md:px-10 lg:px-20">
      <div className="flex flex-col mb-8 gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Promotional & Festival Banners</h2>
        <p className="text-gray-600 max-w-2xl">
          Browse and manage your AI-generated promotional posters, quotes, and offer announcements.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2.5 mb-8 border-b border-gray-100 pb-4">
        {[
          { id: 'all', label: 'All Banners', count: promos.length },
          { id: 'festival', label: 'Festival Promos', count: promos.filter(p => p.type === 'festival').length },
          { id: 'quote', label: 'Quote Posts', count: promos.filter(p => p.type === 'quote').length },
          { id: 'offer', label: 'Offer Posts', count: promos.filter(p => p.type === 'offer').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white shadow-md shadow-red-500/20 scale-[1.02]'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              filterType === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600 font-bold'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6666]"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 font-medium">{error}</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 max-w-lg mx-auto">
          <p className="text-gray-500 mb-6 font-medium">You haven't generated any promotional banners yet.</p>
          <a
            href="/promo-creator"
            className="px-6 py-3 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white rounded-lg font-bold shadow hover:opacity-90 transition-all cursor-pointer"
          >
            Create Your First Banner
          </a>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 max-w-lg mx-auto">
          <p className="text-gray-500 mb-6 font-medium">
            {filterType === 'festival' && "You haven't generated any festival promo posters yet."}
            {filterType === 'quote' && "You haven't generated any quote posts yet."}
            {filterType === 'offer' && "You haven't generated any offer posts yet."}
          </p>
          <a
            href={
              filterType === 'festival' 
                ? "/promo-creator/festival" 
                : filterType === 'quote' 
                  ? "/promo-creator/quote" 
                  : "/promo-creator/offer"
            }
            className="px-6 py-3 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white rounded-lg font-bold shadow hover:opacity-90 transition-all cursor-pointer"
          >
            {filterType === 'festival' && "Create Festival Banner"}
            {filterType === 'quote' && "Create Quote Post"}
            {filterType === 'offer' && "Create Offer Post"}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPromos.map((promo) => (
            <div key={promo.id} className="group relative flex flex-col border border-gray-200 rounded-xl bg-gray-50 overflow-hidden hover:shadow-md transition-all">
              
              {/* Image Preview Container */}
              <div className="p-4 bg-gray-100 flex items-center justify-center relative aspect-square overflow-hidden border-b border-gray-200">
                <img 
                  src={promo.generatedImageUrl} 
                  alt={getPostTitle(promo)} 
                  className="rounded-lg max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                />
                
                {/* Actions overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <button
                    className="text-yellow-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    onClick={() => toggleFavorite(promo.id, promo.type)}
                    title={promo.favorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    {promo.favorite ? <FaStar size={16} /> : <FaRegStar size={16} className="text-gray-500" />}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => handleDownload(promo.id, promo.type, getPostDownloadName(promo))}
                    className="text-gray-600 hover:text-[#FF6666] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Download Poster"
                  >
                    <FiDownload size={16} />
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setActivePublishPost(promo)}
                    className="text-gray-600 hover:text-pink-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Share to Instagram"
                  >
                    <FaInstagram size={16} />
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    className="text-gray-600 hover:text-red-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    onClick={() => handleDelete(promo.id, promo.type)}
                    title="Delete Poster"
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="text-md font-bold text-gray-800 line-clamp-1 flex-1">{getPostTitle(promo)}</h3>
                    
                    {/* Post Type Indicator Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      promo.type === 'festival' ? 'bg-purple-100 text-purple-700' :
                      promo.type === 'quote' ? 'bg-blue-100 text-blue-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {promo.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {getPostTagline(promo) && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                        {getPostTagline(promo)}
                      </span>
                    )}
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

      {activePublishPost && (
        <PublishModal 
          post={activePublishPost} 
          onClose={() => setActivePublishPost(null)} 
        />
      )}
    </div>
  );
};

export default PromoGallery;
