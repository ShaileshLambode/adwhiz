import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const PromoCreator = () => {
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');

  // Wizard Steps:
  // 1: Brand & Occasion Selection + AI Fill
  // 2: Review Content
  // 3: Style & Size Preset
  // 4: Preview & Generate
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  
  // New Structured State
  const [heroContent, setHeroContent] = useState({ headline: "", subheading: "", bodyMessage: "", closingSlogan: "", rightBoxQuote: "" });
  const [valuesRow, setValuesRow] = useState([]);
  const [featuresBar, setFeaturesBar] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [footerColumns, setFooterColumns] = useState([]);

  const [aspectRatio, setAspectRatio] = useState("1024x1024");
  const [stylePreset, setStylePreset] = useState("digital_illustration/flat_design");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [generatedResult, setGeneratedResult] = useState(null);

  // AI Fill states
  const [festivalName, setFestivalName] = useState('');
  const [isAIFilling, setIsAIFilling] = useState(false);
  const [aiGeneratedColors, setAiGeneratedColors] = useState([]);
  const [aiScenePrompt, setAiScenePrompt] = useState('');
  const [festivalPalette, setFestivalPalette] = useState(null);

  const FESTIVAL_CHIPS = [
    'Diwali', 'Holi', 'Bhai Dooj', 'Eid Mubarak',
    'Independence Day', 'Raksha Bandhan', 'Christmas', 'New Year'
  ];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/promo/templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTemplates(res.data.templates || []);
      } catch (err) {
        console.error("Error fetching templates:", err);
        toast.error("Failed to load templates.");
      } finally {
        setLoadingTemplates(false);
      }
    };

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
      fetchTemplates();
      fetchBusinesses();
    }
  }, [BACKEND_URL, token]);

  // Handle selecting a template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    
    // Initialize hero content
    setHeroContent({
      headline: template.heroContent?.headline || "",
      subheading: template.heroContent?.subheading || "",
      bodyMessage: template.heroContent?.bodyMessage || "",
      closingSlogan: template.heroContent?.closingSlogan || "",
      rightBoxQuote: template.heroContent?.rightBoxQuote || "",
    });

    // Initialize values row (3 items) using safe unicode symbols
    setValuesRow(
      (template.valuesRow && template.valuesRow.length === 3)
        ? template.valuesRow.map(v => ({ icon: v.icon || "★", label: v.label || "", sublabel: v.sublabel || "" }))
        : [
            { icon: "★", label: "LOVE", sublabel: "that never ends" },
            { icon: "◆", label: "JOY", sublabel: "every moment" },
            { icon: "●", label: "CELEBRATE", sublabel: "togetherness" }
          ]
    );

    // Initialize features bar (4 items) using safe unicode symbols
    setFeaturesBar(
      (template.featuresBar && template.featuresBar.length === 4)
        ? template.featuresBar.map(f => ({ icon: f.icon || "★", text: f.text || "" }))
        : [
            { icon: "★", text: "THOUGHTFUL GIFTS THAT BRING SMILES." },
            { icon: "◆", text: "PREMIUM QUALITY. BUILT TO LAST." },
            { icon: "♥", text: "MADE TO DELIGHT. MADE FOR YOU." },
            { icon: "●", text: "PROUDLY DESIGNED IN INDIA." }
          ]
    );

    // Initialize product categories (user customizable list)
    setProductCategories(
      template.productCategories
        ? template.productCategories.map(p => ({ imageUrl: p.imageUrl || null, name: p.name || "" }))
        : []
    );

    // Initialize footer columns (4 columns) using safe unicode symbols
    setFooterColumns(
      (template.footerColumns && template.footerColumns.length === 4)
        ? template.footerColumns.map(col => ({
            icon: col.icon || "★",
            lines: col.lines ? col.lines.join('\n') : "",
            highlight: col.highlight || ""
          }))
        : [
            { icon: "★", lines: "", highlight: "" },
            { icon: "◆", lines: "", highlight: "" },
            { icon: "♥", lines: "", highlight: "" },
            { icon: "●", lines: "", highlight: "" }
          ]
    );

    setAspectRatio(template.aspectRatio || "1024x1024");
  };

  // Automatically select the default template once templates are loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      handleSelectTemplate(templates[0]);
    }
  }, [templates, selectedTemplate]);

  // Handle selecting business
  const handleSelectBusiness = (biz) => {
    setSelectedBusiness(biz);
    
    // Replace "AIMAVEN" with the business name in heroContent and footerColumns
    const brandName = biz.name || "AIMAVEN";
    
    setHeroContent(prev => ({
      ...prev,
      bodyMessage: prev.bodyMessage.replace(/AIMAVEN/gi, brandName),
      rightBoxQuote: prev.rightBoxQuote.replace(/AIMAVEN/gi, brandName),
    }));

    setFooterColumns(prev => prev.map(col => ({
      ...col,
      lines: col.lines.replace(/AIMAVEN/gi, brandName),
      highlight: col.highlight.replace(/AIMAVEN/gi, brandName),
    })));
  };

  // Content change handlers
  const handleValueChange = (index, field, value) => {
    setValuesRow(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleFeatureChange = (index, field, value) => {
    setFeaturesBar(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleProductChange = (index, field, value) => {
    setProductCategories(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleAddProduct = () => {
    if (productCategories.length >= 8) {
      toast.warning("Maximum of 8 products reached.");
      return;
    }
    setProductCategories(prev => [...prev, { imageUrl: null, name: "NEW PRODUCT" }]);
  };

  const handleProductImageUpload = async (index, file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/promo/upload-product-image`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setProductCategories(prev => prev.map((item, idx) => idx === index ? { ...item, imageUrl: res.data.imageUrl } : item));
      toast.success('Product image uploaded successfully!');
    } catch (err) {
      console.error('Failed to upload product image:', err);
      toast.error('Failed to upload product image');
    }
  };

  const handleRemoveProduct = (index) => {
    setProductCategories(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFooterChange = (index, field, value) => {
    setFooterColumns(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleAIFill = async () => {
    if (!selectedBusiness || !festivalName.trim()) {
      toast.warning('Select a business and enter the festival name first.');
      return;
    }
    setIsAIFilling(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/promo/ai-fill`, {
        businessName: selectedBusiness.name,
        festivalName: festivalName.trim(),
        sector: selectedBusiness.sector || '',
        website: selectedBusiness.website || '',
        email: selectedBusiness.email || '',
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { content } = res.data;
      setHeroContent(content.heroContent);
      setValuesRow(content.valuesRow);
      setFeaturesBar(content.featuresBar);
      setFooterColumns(content.footerColumns.map(col => ({
        ...col,
        lines: Array.isArray(col.lines) ? col.lines.join('\n') : (col.lines || ''),
      })));
      setAiGeneratedColors(content.suggestedColors || []);
      setAiScenePrompt(content.recraftScenePrompt || '');
      setFestivalPalette(content.festivalPalette || null);

      toast.success('✨ AI filled all content! Review and edit in Step 2.');
      setCurrentStep(2);
    } catch (err) {
      console.error('AI fill error:', err);
      toast.error('AI fill failed. You can still enter details manually.');
      setCurrentStep(2); // still advance so user can fill manually
    } finally {
      setIsAIFilling(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedBusiness) {
        toast.warning("Please select a business logo profile first.");
        return;
      }
      if (!festivalName.trim()) {
        toast.warning("Please enter the festival/occasion name.");
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
    setGenerationProgress("Contacting Recraft V3 scene generator...");

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      await delay(1200);
      setGenerationProgress("Generating illustration scene buffer...");
      await delay(1500);
      setGenerationProgress("Downloading graphics and scaling logo...");
      await delay(1200);
      setGenerationProgress("Compositing vertical layout zones with Sharp...");
      await delay(1200);
      setGenerationProgress("Uploading high-resolution poster to Cloudinary...");

      const payload = {
        templateId: selectedTemplate ? selectedTemplate._id : undefined,
        logoId: selectedBusiness._id,
        size: aspectRatio,
        stylePreset: stylePreset,
        heroContent,
        valuesRow,
        featuresBar,
        productCategories,
        footerColumns: footerColumns.map(col => ({
          icon: col.icon,
          lines: col.lines.split('\n').map(l => l.trim()).filter(Boolean),
          highlight: col.highlight || null
        })),
        aiSuggestedColors: aiGeneratedColors,
        recraftScenePrompt: aiScenePrompt,
        occasion: festivalName.trim(),
        festivalPalette: festivalPalette
      };

      const res = await axios.post(`${BACKEND_URL}/api/promo/generate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.promoPost) {
        setGeneratedResult(res.data.promoPost);
        toast.success("Marketing poster generated successfully!");
        setCurrentStep(4);
      } else {
        toast.error("Generation failed. Please try again.");
      }
    } catch (err) {
      console.error("Error generating promo post:", err);
      toast.error(err.response?.data?.error || "Error during generation.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleDownload = async (postId, occasion) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/promo/download/${postId}`, {
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

  // Recraft style preset selections
  const stylePresets = [
    {
      value: "digital_illustration",
      label: "Flat Design (Recommended)",
      description: "Clean flat 2D graphic design — best for festival posters"
    },
    {
      value: "digital_illustration/2d_art_poster",
      label: "Art Poster Style",
      description: "Bold poster art with strong graphic elements"
    },
    {
      value: "digital_illustration/engraving_color",
      label: "Vintage Style",
      description: "Classic detailed texture, retro feel"
    },
    {
      value: "digital_illustration/hand_drawn",
      label: "Hand Drawn",
      description: "Warm artistic hand-illustrated style"
    },
    {
      value: "digital_illustration/handmade_3d",
      label: "3D Render",
      description: "CGI model style, depth, and rich highlights"
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen px-4 py-8 sm:px-6 md:px-10 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] p-6 text-white text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">AI Festival & Promo Creator</h1>
          <p className="mt-2 text-red-50 text-sm">Design structured marketing posters with automated logo & text overlay</p>
          
          {/* Progress bar */}
          <div className="flex items-center justify-between mt-8 max-w-lg mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                  currentStep >= step 
                    ? "bg-white text-[#FF6666] border-white scale-110 shadow-md" 
                    : "bg-transparent text-red-200 border-red-200"
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                    currentStep > step ? "bg-white" : "bg-red-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-lg mx-auto text-xs text-red-100 mt-2 px-1">
            <span>Occasion & Brand</span>
            <span>Review Content</span>
            <span>Style & Size</span>
            <span>Review & Save</span>
          </div>
        </div>

        <div className="p-8">
          
          {/* STEP 1: Occasion & Brand Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Select Business Profile / Logo</h2>
                <p className="text-sm text-gray-500 mb-4">Choose which business details and logo to composite onto the generated marketing poster.</p>
                
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
                <h2 className="text-xl font-bold text-gray-800 mb-2">Enter Festival / Occasion</h2>
                <p className="text-sm text-gray-500 mb-4">Type the name of the festival or marketing campaign you want to generate.</p>
                
                <div className="space-y-4 max-w-lg">
                  <div>
                    <input 
                      type="text" 
                      placeholder="e.g. Diwali, Holi, Independence Day, Independence Day Sale"
                      value={festivalName}
                      onChange={(e) => setFestivalName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all font-semibold"
                    />
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2">
                    {FESTIVAL_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setFestivalName(chip)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          festivalName === chip
                            ? "bg-[#FF6666] text-white border-[#FF6666]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* AI Fill Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAIFill}
                      disabled={isAIFilling}
                      className="relative overflow-hidden w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isAIFilling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>AI is writing copy...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">✨</span>
                          <span>Generate with AI</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-gray-400 mt-2">OpenAI GPT-4o-mini will write high-converting copy for all zones in ~2 seconds.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Edit Poster Content */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Edit Poster Content</h2>
              <p className="text-sm text-gray-500 mb-6">Customize the content for each of the poster zones. The layout will be dynamically composited on the server.</p>
              
              <div className="space-y-8 max-w-2xl">
                
                {/* Hero Content */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📝</span> Zone 2 — Hero & Slogans
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Headline</label>
                      <input 
                        type="text" 
                        value={heroContent.headline} 
                        onChange={(e) => setHeroContent({ ...heroContent, headline: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subheading</label>
                      <input 
                        type="text" 
                        value={heroContent.subheading} 
                        onChange={(e) => setHeroContent({ ...heroContent, subheading: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Body Message</label>
                      <textarea 
                        rows={3}
                        value={heroContent.bodyMessage} 
                        onChange={(e) => setHeroContent({ ...heroContent, bodyMessage: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Closing Slogan</label>
                        <input 
                          type="text" 
                          value={heroContent.closingSlogan} 
                          onChange={(e) => setHeroContent({ ...heroContent, closingSlogan: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Right Quote Box</label>
                        <input 
                          type="text" 
                          value={heroContent.rightBoxQuote} 
                          onChange={(e) => setHeroContent({ ...heroContent, rightBoxQuote: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6666] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Values Row */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>🌟</span> Zone 3 — Values Row (3 Columns)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {valuesRow.map((val, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Icon"
                            value={val.icon} 
                            onChange={(e) => handleValueChange(idx, 'icon', e.target.value)}
                            className="w-12 border border-gray-300 rounded-md p-1.5 text-center text-sm"
                          />
                          <input 
                            type="text" 
                            placeholder="Label"
                            value={val.label} 
                            onChange={(e) => handleValueChange(idx, 'label', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md p-1.5 text-sm font-semibold"
                          />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Sublabel"
                          value={val.sublabel} 
                          onChange={(e) => handleValueChange(idx, 'sublabel', e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-1.5 text-xs text-gray-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Marketing Features Bar */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>⚡</span> Zone 4 — Marketing Features (4 Columns)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuresBar.map((feat, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Icon"
                            value={feat.icon} 
                            onChange={(e) => handleFeatureChange(idx, 'icon', e.target.value)}
                            className="w-12 border border-gray-300 rounded-md p-1.5 text-center text-sm"
                          />
                          <input 
                            type="text" 
                            placeholder="Feature Text"
                            value={feat.text} 
                            onChange={(e) => handleFeatureChange(idx, 'text', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md p-1.5 text-sm font-semibold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Categories */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span>👜</span> Zone 5 — Product Categories Showcase
                    </h3>
                    <button 
                      type="button"
                      onClick={handleAddProduct}
                      className="text-xs bg-[#FF6666] text-white px-2.5 py-1.5 rounded-lg font-bold hover:opacity-90"
                    >
                      + Add Product
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {productCategories.map((prod, idx) => (
                      <div key={idx} className="flex gap-2 bg-white p-2 rounded-lg border border-gray-200 items-center justify-between">
                        <label className="cursor-pointer flex-shrink-0">
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt="" className="w-10 h-10 object-cover rounded-md border"/>
                          ) : (
                            <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs font-bold">
                              +
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files[0] && handleProductImageUpload(idx, e.target.files[0])}
                          />
                        </label>
                        <input 
                          type="text" 
                          placeholder="Product Name"
                          value={prod.name} 
                          onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md p-1.5 text-sm ml-1"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveProduct(idx)}
                          className="text-red-500 text-sm hover:scale-105 px-2 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Columns */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📋</span> Zone 6 — Footer Columns (4 Columns)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {footerColumns.map((col, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex gap-2 items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-gray-400 uppercase">Column {idx + 1}</span>
                          <input 
                            type="text" 
                            placeholder="Icon"
                            value={col.icon} 
                            onChange={(e) => handleFooterChange(idx, 'icon', e.target.value)}
                            className="w-10 border border-gray-300 rounded-md p-1 text-center text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Text Lines (One per line)</label>
                          <textarea 
                            rows={3}
                            placeholder="Line 1&#10;Line 2&#10;Line 3"
                            value={col.lines} 
                            onChange={(e) => handleFooterChange(idx, 'lines', e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Highlight (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="Highlighted text"
                            value={col.highlight} 
                            onChange={(e) => handleFooterChange(idx, 'highlight', e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-1.5 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: Style and Presets */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Style & Dimensions</h2>
              <p className="text-sm text-gray-500 mb-6">Fine-tune the output format and Recraft V3 graphic render model preset.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Size Selector */}
                <div>
                  <h3 className="block text-sm font-semibold text-gray-700 mb-3">Aspect Ratio / Size</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {["1024x1024", "1024x1365", "1365x1024", "1024x1536"].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setAspectRatio(sz)}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                          aspectRatio === sz 
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

                {/* Style Presets */}
                <div>
                  <h3 className="block text-sm font-semibold text-gray-700 mb-3">Recraft V3 Render Style</h3>
                  <div className="space-y-3">
                    {stylePresets.map((preset) => (
                      <div 
                        key={preset.value}
                        onClick={() => setStylePreset(preset.value)}
                        className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all ${
                          stylePreset === preset.value 
                            ? "border-[#FF6666] bg-red-50/50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <h4 className={`text-sm font-bold ${stylePreset === preset.value ? "text-[#FF6666]" : "text-gray-800"}`}>{preset.label}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{preset.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preview & Generate / Result */}
          {currentStep === 4 && (
            <div>
              {generatedResult ? (
                <div className="text-center py-6">
                  <h2 className="text-2xl font-black text-gray-800 mb-2">🎉 Masterpiece Ready!</h2>
                  <p className="text-sm text-gray-500 mb-6">Your festival promotional banner has been successfully built and saved.</p>
                  
                  <div className="max-w-md mx-auto bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-inner mb-6">
                    <img 
                      src={generatedResult.generatedImageUrl} 
                      alt="Generated Promo Poster" 
                      className="max-w-full h-auto rounded-lg shadow-md mx-auto" 
                    />
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleDownload(generatedResult._id, generatedResult.occasion)}
                      className="px-6 py-3 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Download Poster
                    </button>
                    <button 
                      onClick={() => {
                        setGeneratedResult(null);
                        setFestivalName('');
                        setAiGeneratedColors([]);
                        setAiScenePrompt('');
                        setFestivalPalette(null);
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
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Promo Generation Details</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4 mb-6">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">Occasion Name</span>
                      <span className="text-sm font-bold text-gray-800 capitalize">{festivalName}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">Brand Logo Profile</span>
                      <span className="text-sm font-bold text-gray-800">{selectedBusiness?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">Poster Dimensions</span>
                      <span className="text-sm font-bold text-gray-800">{aspectRatio}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">Recraft Style Preset</span>
                      <span className="text-sm font-bold text-gray-800 uppercase text-xs tracking-wider">{stylePreset.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-2">Overlay Custom Texts:</span>
                      <div className="space-y-1.5 pl-3 border-l-2 border-[#FF6666]">
                        <div className="text-xs">
                          <span className="text-gray-400 uppercase font-semibold mr-1.5">Headline:</span>
                          <span className="text-gray-700 italic">"{heroContent.headline}"</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400 uppercase font-semibold mr-1.5">Subheading:</span>
                          <span className="text-gray-700 italic">"{heroContent.subheading}"</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400 uppercase font-semibold mr-1.5">Values:</span>
                          <span className="text-gray-700 italic">{valuesRow.map(v => `${v.icon} ${v.label}`).join(' | ')}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400 uppercase font-semibold mr-1.5">Features:</span>
                          <span className="text-gray-700 italic">{featuresBar.map(f => `${f.icon} ${f.text}`).join(' | ')}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400 uppercase font-semibold mr-1.5">Products:</span>
                          <span className="text-gray-700 italic">{productCategories.map(p => `${p.imageUrl ? '📷' : '🎒'} ${p.name}`).join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isGenerating ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6666] mx-auto mb-4"></div>
                      <p className="text-[#FF6666] font-bold text-lg animate-pulse">{generationProgress}</p>
                      <p className="text-xs text-gray-400 mt-2">Please wait. AI rendering takes 10-15 seconds.</p>
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
                        <span>Generate Promo Poster</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          {currentStep < 4 && !isGenerating && (
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
                {currentStep === 3 ? "Go to Preview" : "Continue"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PromoCreator;

