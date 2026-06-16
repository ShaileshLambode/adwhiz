import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaInstagram } from 'react-icons/fa';
import PublishModal from '../components/PublishModal';

const COLOR_CHIPS = [
  { value: '#FFD700', label: 'Gold 💛' },
  { value: '#FF3333', label: 'Red ❤️' },
  { value: '#2B6CB0', label: 'Blue 💙' },
  { value: '#319795', label: 'Teal 💚' },
  { value: '#DD6B20', label: 'Orange 🧡' },
];

export default function OfferCreator() {
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');

  const [currentStep, setCurrentStep] = useState(1);
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Form states
  const [offerHeadline, setOfferHeadline] = useState('');
  const [offerDetails, setOfferDetails] = useState('');
  const [validity, setValidity] = useState('');
  const [cta, setCta] = useState('');
  const [accentColor, setAccentColor] = useState('#FFD700');
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
      if (!offerHeadline.trim()) {
        toast.warning("Please enter the offer headline.");
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
    setGenerationProgress("Connecting to OpenAI to polish offer copywriting...");

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      await delay(1200);
      setGenerationProgress("Requesting custom background scene from Recraft V3...");
      await delay(1500);
      setGenerationProgress("Downloading generated illustration and logo buffers...");
      await delay(1200);
      setGenerationProgress("Compositing 3 layout zones with Sharp...");
      await delay(1200);
      setGenerationProgress("Uploading high-resolution offer banner to Cloudinary...");

      const payload = {
        logoId: selectedBusiness._id,
        offerHeadline: offerHeadline.trim(),
        offerDetails: offerDetails.trim() || undefined,
        validity: validity.trim() || undefined,
        cta: cta.trim() || undefined,
        accentColor,
        size
      };

      const res = await axios.post(`${BACKEND_URL}/api/offer/generate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.post) {
        setGeneratedResult(res.data.post);
        toast.success("Offer poster generated successfully!");
        setCurrentStep(3);
      } else {
        toast.error("Generation failed. Please try again.");
      }
    } catch (err) {
      console.error("Error generating offer post:", err);
      toast.error(err.response?.data?.error || "Error during generation.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleDownload = async (postId, headline) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/offer/download/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download image");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `offer_${headline?.replace(/\s+/g, '_') || "image"}.jpg`;
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
          <h1 className="text-3xl font-extrabold tracking-tight">AI Offer & Announcement Creator</h1>
          <p className="mt-2 text-red-50 text-sm">Design structured offer announcements and discount posters in seconds</p>
          
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
            <span>Offer Details</span>
            <span>Dimensions</span>
            <span>Review & Save</span>
          </div>
        </div>

        <div className="p-8">
          
          {/* STEP 1: Offer Details & Brand Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Select Business Profile / Logo</h2>
                <p className="text-sm text-gray-500 mb-4">Choose which business details and logo to composite onto the generated offer poster.</p>
                
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
                <h2 className="text-xl font-bold text-gray-800 mb-2">Announcement / Offer Information</h2>
                <p className="text-sm text-gray-500 mb-4">Enter details about your promotion. GPT will polish the spelling and formatting dynamically.</p>
                
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Offer Headline</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 30% OFF THIS WEEKEND"
                      value={offerHeadline}
                      onChange={(e) => setOfferHeadline(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all font-semibold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Offer Details (Optional)</label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. On all premium leather jackets and accessories. No coupon needed."
                      value={offerDetails}
                      onChange={(e) => setOfferDetails(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Validity (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Valid till 30th June"
                        value={validity}
                        onChange={(e) => setValidity(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all font-semibold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Call to Action (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. VISIT STORE TODAY"
                        value={cta}
                        onChange={(e) => setCta(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all font-semibold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Brand Accent Color</label>
                    <div className="flex items-center gap-4">
                      {/* Color Picker Input */}
                      <div className="flex items-center gap-1.5 border border-gray-200 p-1.5 rounded-xl bg-white shadow-sm">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-9 h-9 border-none cursor-pointer rounded-lg overflow-hidden"
                        />
                        <span className="text-xs font-bold text-gray-700 font-mono uppercase pr-2">{accentColor}</span>
                      </div>
                      
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_CHIPS.map((chip) => (
                          <button
                            key={chip.value}
                            type="button"
                            onClick={() => setAccentColor(chip.value)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                              accentColor.toLowerCase() === chip.value.toLowerCase()
                                ? 'border-gray-900 bg-gray-50 shadow-xs'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

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
                  <h2 className="text-2xl font-black text-gray-800 mb-2">🎉 Offer Poster Ready!</h2>
                  <p className="text-sm text-gray-500 mb-6">Your brand promotional offer banner has been created successfully.</p>
                  
                  <div className="max-w-md mx-auto bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-inner mb-6">
                    <img 
                      src={generatedResult.generatedImageUrl} 
                      alt="Generated Offer Banner" 
                      className="max-w-full h-auto rounded-lg shadow-md mx-auto" 
                    />
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => handleDownload(generatedResult._id, generatedResult.offerHeadline)}
                      className="px-6 py-3 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Download Banner
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
                        setOfferHeadline('');
                        setOfferDetails('');
                        setValidity('');
                        setCta('');
                        setAccentColor('#FFD700');
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
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Offer Banner Details</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4 mb-6 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Business Profile</span>
                      <span className="font-bold text-gray-800">{selectedBusiness?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Headline</span>
                      <span className="font-bold text-gray-800 capitalize">"{offerHeadline}"</span>
                    </div>
                    {offerDetails && (
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Details</span>
                        <span className="font-bold text-gray-800">{offerDetails}</span>
                      </div>
                    )}
                    {validity && (
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Validity</span>
                        <span className="font-bold text-gray-800">{validity}</span>
                      </div>
                    )}
                    {cta && (
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">CTA Button</span>
                        <span className="font-bold text-gray-800 uppercase tracking-wider">{cta}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
                      <span className="text-gray-500">Accent Color</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded border border-gray-300 shadow-xs" style={{ backgroundColor: accentColor }}></div>
                        <span className="font-mono font-bold text-gray-800 uppercase">{accentColor}</span>
                      </div>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Poster Dimensions</span>
                      <span className="font-bold text-gray-800">{size}</span>
                    </div>
                  </div>

                  {isGenerating ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6666] mx-auto mb-4"></div>
                      <p className="text-[#FF6666] font-bold text-lg animate-pulse">{generationProgress}</p>
                      <p className="text-xs text-gray-400 mt-2">Please wait. AI background generation and compositing takes ~10 seconds.</p>
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
                        <span>Generate Offer Post</span>
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
