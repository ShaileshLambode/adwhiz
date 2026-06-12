import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaInstagram, FaCheckCircle, FaExclamationTriangle, FaTrashAlt, FaExternalLinkAlt } from 'react-icons/fa';

export default function SocialConnect() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const API = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // Handle OAuth redirect back from Meta
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    
    if (connected === 'instagram') {
      toast.success('Instagram account connected successfully!');
      // Clear URL query params
      navigate('/settings/social', { replace: true });
    }
    if (error) {
      if (error === 'instagram_denied') {
        toast.warning('Instagram connection was cancelled.');
      } else {
        toast.error('Failed to connect Instagram. Please try again.');
      }
      navigate('/settings/social', { replace: true });
    }
    fetchAccount();
  }, [searchParams]);

  const fetchAccount = async () => {
    try {
      const res = await axios.get(`${API}/api/social/account`, { headers });
      setAccount(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch social account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await axios.get(`${API}/api/social/instagram/auth-url`, { headers });
      window.location.href = res.data.authUrl;  // redirect to Instagram OAuth
    } catch (err) {
      console.error(err);
      toast.error('Could not initiate Instagram connection.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Instagram account? You will not be able to publish posters directly.')) return;
    try {
      await axios.delete(`${API}/api/social/disconnect`, { headers });
      setAccount({ connected: false });
      toast.info('Instagram account disconnected.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to disconnect Instagram.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6666]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-8">
        {/* Banner with gradient */}
        <div className="bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] p-8 text-white">
          <h2 className="text-3xl font-extrabold mb-2 font-outfit">Social Connections</h2>
          <p className="text-white/80 max-w-xl text-sm leading-relaxed">
            Link your professional social media accounts to publish your AI-generated marketing posts directly to your feeds.
          </p>
        </div>

        <div className="p-8">
          <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Instagram Gradient Logo representation */}
                <div className="w-14 h-14 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-2xl flex items-center justify-center shadow-lg text-white transform hover:scale-105 transition-transform duration-300">
                  <FaInstagram size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-outfit">Instagram Publishing</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Publish feed posts directly from the gallery</p>
                </div>
              </div>

              <div>
                {account?.connected ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 text-xs font-semibold">
                    <FaCheckCircle /> Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200 text-xs font-semibold">
                    Not Connected
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              {account?.connected ? (
                <div className="space-y-6">
                  {/* Connected Account Display Card */}
                  <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-xs">
                    {account.profilePicUrl ? (
                      <img 
                        src={account.profilePicUrl} 
                        className="w-14 h-14 rounded-full border-2 border-[#FF6666]/30 object-cover shadow-sm" 
                        alt="Instagram profile picture" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#F8AD9D] to-[#FF6666] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {account.username?.slice(0, 2).toUpperCase() || 'IG'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-lg">@{account.username}</span>
                        <a 
                          href={`https://instagram.com/${account.username}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-400 hover:text-[#FF6666] text-xs transition-colors"
                          title="View on Instagram"
                        >
                          <FaExternalLinkAlt size={10} />
                        </a>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">
                        {account.needsReconnect ? (
                          <span className="flex items-center gap-1 text-amber-600">
                            <FaExclamationTriangle /> Token expired. Please reconnect.
                          </span>
                        ) : (
                          <span>
                            Token expires: {new Date(account.tokenExpiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConnect}
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Reconnect Account
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="py-3 px-5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FaTrashAlt /> Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaInstagram size={20} />
                  Connect Instagram Business Account
                </button>
              )}
            </div>
          </div>

          {/* Onboarding tips card */}
          <div className="mt-8 bg-amber-50/40 border border-amber-100 rounded-2xl p-6">
            <h4 className="text-md font-bold text-amber-800 flex items-center gap-2 mb-3">
              <FaExclamationTriangle /> Integration Requirements
            </h4>
            <ul className="space-y-2.5 text-sm text-amber-900/80 leading-relaxed list-disc list-inside">
              <li>
                <strong>Instagram Professional Account</strong> (Business or Creator) is required. Personal accounts cannot be used with Meta's publishing APIs.
              </li>
              <li>
                To convert your account: open the Instagram App → Go to your profile → Tap <strong>Settings</strong> → <strong>Account type</strong> → <strong>Switch to Professional Account</strong>.
              </li>
              <li>
                Ensure you have added your Instagram Professional account under Meta Developer Console Roles if you are currently running in Standard / sandbox mode.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
