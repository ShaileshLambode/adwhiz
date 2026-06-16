import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaInstagram } from 'react-icons/fa';
import PublishModal from '../components/PublishModal';

const THEMES = [
  'Customer Success', 'Innovation & AI', 'Team Spirit', 'Quality & Trust',
  'Growth Mindset', 'Gratitude', 'Festive Cheer', 'Monday Motivation'
];

const TONES = [
  { value: 'inspirational', label: 'Inspirational ✨' },
  { value: 'witty',         label: 'Witty 😄' },
  { value: 'warm',          label: 'Warm & Caring 💛' },
  { value: 'bold',          label: 'Bold & Confident 💪' },
];

export default function QuoteCreator() {
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');

  const [currentStep, setCurrentStep] = useState(1);
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Form states
  const [theme, setTheme] = useState('');
  const [tone, setTone] = useState('inspirational');
  const [customQuote, setCustomQuote] = useState('');
  const [useCustomQuote, setUseCustomQuote] = useState(false);
  const [size, setSize] = useState('1024x1024');

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [activePublishPost, setActivePublishPost] = useState(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/logo/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBusinesses(res.data.posts || []);
      } catch (err) {
        console.error("Error fetching businesses:", err);
        toast.error("Failed to load business profiles.");
      } finally {
        setLoadingBusinesses(false);
      }
    };

    if (token) {
      fetchBusinesses();
    }
  }, [BACKEND_URL, token]);

  const handleSelectBusiness = (biz) => {
    setSelectedBusiness(biz);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedBusiness) {
        toast.warning("Please select a business profile first.");
        return;
      }
      if (!useCustomQuote && !theme.trim()) {
        toast.warning("Please select a theme or write a custom quote.");
        return;
      }
      if (useCustomQuote && !customQuote.trim()) {
        toast.warning("Please enter your custom quote text.");
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress("Connecting to OpenAI to draft quote copywriting...");

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      await delay(1200);
      setGenerationProgress("Requesting background generation from Recraft V3...");
      await delay(1500);
      setGenerationProgress("Downloading generated texture and logo assets...");
      await delay(1200);
      setGenerationProgress("Overlaying typography with Sharp vector engine...");
      await delay(1200);
      setGenerationProgress("Uploading high-resolution quote to Cloudinary...");

      const payload = {
        logoId: selectedBusiness._id,
        theme: useCustomQuote ? 'Custom Quote' : theme,
        tone,
        customQuote: useCustomQuote ? customQuote.trim() : null,
        size
      };

      const res = await axios.post(`${BACKEND_URL}/api/quote/generate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.post) {
        setGeneratedResult(res.data.post);
        toast.success("Quote poster generated successfully!");
        setCurrentStep(3);
      } else {
        toast.error("Generation failed. Please try again.");
      }
    } catch (err) {
      console.error("Error generating quote post:", err);
      toast.error(err.response?.data?.error || "Error during generation.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleDownload = async (postId, themeName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/quote/download/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download image");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quote_${themeName || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Image download error:", error);
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-4 py-8 sm:px-6 md:px-10 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] p-6 text-white text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">AI Quote & Motivational Creator</h1>
          <p className="mt-2 text-red-50 text-sm">Design beautiful motivational quotes with brand-composited overlays</p>
          
          {/* Progress bar */}
          <div className="flex items-center justify-between mt-8 max-w-md mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                  currentStep >= step 
                    ? "bg-white text-[#FF6666] border-white scale-110 shadow-md" 
                    : "bg-transparent text-red-200 border-red-200"
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                    currentStep > step ? "bg-white" : "bg-red-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto text-xs text-red-100 mt-2 px-1">
            <span>Occasion & Theme</span>
            <span>Dimensions</span>
            <span>Review & Save</span>
          </div>
        </div>

        <div className="p-8">
          
          {/* STEP 1: Theme & Brand Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Select Business Profile / Logo</h2>
                <p className="text-sm text-gray-500 mb-4">Choose which business details and logo to composite onto the generated quote image.</p>
                
                {loadingBusinesses ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6666]"></div>
                  </div>
                ) : businesses.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-3 text-sm">No business profiles found. Please add a business profile first.</p>
                    <button 
                      onClick={() => navigate('/home')}
                      className="px-4 py-2 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white rounded-lg text-sm font-bold shadow hover:opacity-90 transition-all cursor-pointer"
                    >
                      Go to Add Business
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto p-1 border border-gray-100 rounded-lg">
                    {businesses.map((biz) => (
                      <div 
                        key={biz._id}
                        onClick={() => handleSelectBusiness(biz)}
                        className={`cursor-pointer rounded-xl p-4 border-2 flex items-center gap-4 transition-all duration-200 ${
                          selectedBusiness?._id === biz._id 
                            ? "border-[#FF6666] bg-red-50/50 shadow-sm" 
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-100 p-1.5 flex items-center justify-center border border-gray-200 shrink-0">
                          {biz.images?.url ? (
                            <img src={biz.images.url} alt={biz.name} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium">No Logo</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm leading-snug">{biz.name}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{biz.sector || "General Sector"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Quote Content Settings</h2>
                <p className="text-sm text-gray-500 mb-4">Choose a preset theme for GPT to write the quote, or toggle manually to write your own quote text.</p>
                
                <div className="space-y-4 max-w-xl">
                  {/* Toggle Custom Quote */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="customQuoteToggle"
                      checked={useCustomQuote}
                      onChange={(e) => {
                        useCustomQuote ? setUseCustomQuote(false) : setUseCustomQuote(true);
                      }}
                      className="w-4 h-4 text-[#FF6666] border-gray-300 rounded focus:ring-[#FF6666]"
                    />
                    <label htmlFor="customQuoteToggle" className="text-sm font-bold text-gray-700 cursor-pointer">
                      I want to write my own quote text
                    </label>
                  </div>

                  {!useCustomQuote ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quote Theme</label>
                        <div className="flex flex-wrap gap-2">
                          {THEMES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTheme(t)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                theme === t
                                  ? "bg-[#FF6666] text-white border-[#FF6666]"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tone / Personality</label>
                        <div className="grid grid-cols-2 gap-2">
                          {TONES.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setTone(t.value)}
                              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                tone === t.value
                                  ? "border-[#FF6666] bg-red-50/50 text-[#FF6666]"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Your Custom Quote Text</label>
                      <textarea
                        rows={3}
                        maxLength={120}
                        placeholder="Write your quote here (Maximum 120 characters)..."
                        value={customQuote}
                        onChange={(e) => setCustomQuote(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all font-medium text-sm"
                      />
                      <span className="text-[10px] text-gray-400 font-semibold block text-right mt-1">{customQuote.length} / 120 chars</span>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Dimensions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Select Dimensions / Size</h2>
                <p className="text-sm text-gray-500 mb-6">Choose the layout dimensions that best fit the target social media platform.</p>
                
                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  {["1024x1024", "1024x1365", "1365x1024", "1024x1536"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSize(sz)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                        size === sz 
                          ? "border-[#FF6666] bg-red-50/50 text-[#FF6666]" 
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {sz === "1024x1024" && "Square (1:1)"}
                      {sz === "1024x1365" && "Portrait (4:5)"}
                      {sz === "1365x1024" && "Landscape (5:4)"}
                      {sz === "1024x1536" && "Story (2:3)"}
                      <span className="block text-xs font-normal text-gray-400 mt-0.5">({sz} px)</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm & Generate / Result */}
          {currentStep === 3 && (
            <div>
              {generatedResult ? (
                <div className="text-center py-6">
                  <h2 className="text-2xl font-black text-gray-800 mb-2">🎉 Quote Image Ready!</h2>
                  <p className="text-sm text-gray-500 mb-6">Your motivational brand quote post is generated successfully.</p>
                  
                  <div className="max-w-md mx-auto bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-inner mb-6">
                    <img 
                      src={generatedResult.generatedImageUrl} 
                      alt="Generated Quote" 
                      className="max-w-full h-auto rounded-lg shadow-md mx-auto" 
                    />
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => handleDownload(generatedResult._id, generatedResult.theme)}
                      className="px-6 py-3 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Download Quote
                    </button>
                    <button
                      onClick={() => setActivePublishPost({
                        id: generatedResult._id,
                        generatedImageUrl: generatedResult.generatedImageUrl
                      })}
                      className="px-6 py-3 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <FaInstagram size={18} />
                      Share to Instagram
                    </button>
                    <button 
                      onClick={() => {
                        setGeneratedResult(null);
                        setTheme('');
                        setCustomQuote('');
                        setUseCustomQuote(false);
                        setCurrentStep(1);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all cursor-pointer"
                    >
                      Create Another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Generation Settings</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4 mb-6">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">Business Profile</span>
                      <span className="text-sm font-bold text-gray-800">{selectedBusiness?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">Theme</span>
                      <span className="text-sm font-bold text-gray-800 capitalize">{useCustomQuote ? 'Custom Quote text' : theme}</span>
                    </div>
                    {!useCustomQuote && (
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Tone</span>
                        <span className="text-sm font-bold text-gray-800 capitalize">{tone}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">Aspect Ratio</span>
                      <span className="text-sm font-bold text-gray-800">{size}</span>
                    </div>
                    {useCustomQuote && (
                      <div>
                        <span className="text-sm text-gray-500 block mb-1">Your Quote Text:</span>
                        <p className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-150 font-medium italic">"{customQuote}"</p>
                      </div>
                    )}
                  </div>

                  {isGenerating ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6666] mx-auto mb-4"></div>
                      <p className="text-[#FF6666] font-bold text-lg animate-pulse">{generationProgress}</p>
                      <p className="text-xs text-gray-400 mt-2">Please wait. AI background & compositing takes ~10 seconds.</p>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-1 py-4 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white font-extrabold text-lg rounded-xl shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>⚡</span>
                        <span>Generate Quote Post</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          {currentStep < 3 && !isGenerating && (
            <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-5 py-2.5 rounded-lg font-bold transition-all ${
                  currentStep === 1 
                    ? "text-gray-300 cursor-not-allowed bg-transparent" 
                    : "text-gray-600 hover:bg-gray-100 cursor-pointer"
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white font-bold rounded-lg shadow hover:opacity-90 transition-all cursor-pointer"
              >
                {currentStep === 2 ? "Go to Preview" : "Continue"}
              </button>
            </div>
          )}

        </div>
      </div>
      {activePublishPost && (
        <PublishModal 
          post={activePublishPost} 
          onClose={() => setActivePublishPost(null)} 
        />
      )}
    </div>
  );
}
