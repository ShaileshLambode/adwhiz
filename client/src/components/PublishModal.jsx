import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaInstagram, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function PublishModal({ post, onClose }) {
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);
  const [account, setAccount] = useState(null);
  const [fetchingAccount, setFetchingAccount] = useState(true);
  const navigate = useNavigate();

  const API = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/api/social/account`, { headers })
      .then(res => {
        setAccount(res.data);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load Instagram connection status.');
      })
      .finally(() => {
        setFetchingAccount(false);
      });
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/api/social/publish/instagram`, {
        promoPostId: post.id || post._id,
        caption,
      }, { headers });
      
      setResult({ success: true, message: res.data.message });
      toast.success('Successfully published to Instagram!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Publishing failed';
      const needsReconnect = err?.response?.data?.needsReconnect;
      const needsUpgrade = err?.response?.data?.code === 'FEATURE_NOT_AVAILABLE';
      setResult({ success: false, message: msg, needsReconnect, needsUpgrade });
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleGoToPricing = () => {
    onClose();
    navigate('/pricing');
  };

  const handleGoToSettings = () => {
    onClose();
    navigate('/settings/social');
  };

  if (fetchingAccount) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-gray-100">
          <div className="animate-spin rounded-full h-10 h-10 border-b-2 border-[#FF6666] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Checking Instagram connection...</p>
        </div>
      </div>
    );
  }

  if (!account?.connected) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-4">
            <FaInstagram size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-outfit">Connect Instagram Account</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            You must connect an Instagram Professional (Business or Creator) account before you can share your posters directly.
          </p>
          <button 
            onClick={handleGoToSettings}
            className="w-full py-3 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white rounded-xl font-bold shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            Go to Settings
          </button>
          <button 
            onClick={onClose} 
            className="mt-3.5 text-gray-400 hover:text-gray-600 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-lg flex items-center justify-center text-white">
              <FaInstagram size={16} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-outfit">Share to Instagram</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-all cursor-pointer">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Preview Container */}
        <div className="relative rounded-2xl overflow-hidden mb-4 bg-gray-150 border border-gray-100 group max-h-56 flex items-center justify-center">
          <img 
            src={post.generatedImageUrl} 
            className="max-h-56 w-auto object-contain" 
            alt="Instagram post preview"
          />
        </div>

        {/* Account Info */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
          {account.profilePicUrl ? (
            <img src={account.profilePicUrl} className="w-9 h-9 rounded-full object-cover border border-[#FF6666]/30" alt="" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F8AD9D] to-[#FF6666] flex items-center justify-center text-white font-bold text-xs">
              IG
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">@{account.username}</span>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">Posting live to feed</span>
          </div>
        </div>

        {/* Form elements */}
        {!result && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Caption</label>
              <textarea
                className="w-full border border-gray-200 focus:border-[#FF6666] focus:ring-1 focus:ring-[#FF6666]/30 rounded-2xl p-3 text-sm resize-none h-28 transition-all"
                placeholder="Write an engaging caption... (hashtags are welcome!)"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={2200}
              />
              <div className="flex justify-end text-xs text-gray-400 mt-1 font-semibold">
                {caption.length} / 2200 characters
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full py-4 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all cursor-pointer"
            >
              {publishing ? 'Publishing Post...' : 'Post to Instagram Now'}
            </button>
          </div>
        )}

        {/* Result Area */}
        {result && (
          <div className="space-y-4">
            <div className={`p-5 rounded-2xl border flex flex-col items-center text-center gap-2 ${
              result.success 
                ? 'bg-green-50/50 border-green-100 text-green-800' 
                : 'bg-red-50/50 border-red-100 text-red-700'
            }`}>
              {result.success ? (
                <>
                  <FaCheckCircle size={36} className="text-green-500" />
                  <h4 className="font-bold text-lg font-outfit">Successfully Published!</h4>
                  <p className="text-sm text-green-700/80 leading-relaxed">{result.message}</p>
                </>
              ) : (
                <>
                  <FaExclamationCircle size={36} className="text-red-500" />
                  <h4 className="font-bold text-lg font-outfit">Publishing Failed</h4>
                  <p className="text-sm text-red-600/80 leading-relaxed">{result.message}</p>
                  {result.needsReconnect && (
                    <button 
                      onClick={handleGoToSettings}
                      className="mt-2 text-xs font-bold underline text-red-700 hover:text-red-800 cursor-pointer"
                    >
                      Reconnect Instagram Account
                    </button>
                  )}
                  {result.needsUpgrade && (
                    <button 
                      onClick={handleGoToPricing}
                      className="mt-2 text-xs font-bold underline text-red-700 hover:text-red-800 cursor-pointer"
                    >
                      Upgrade Your Plan
                    </button>
                  )}
                </>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
