import React from 'react';
import { useNavigate } from 'react-router-dom';
import sampleFestival from '../assets/sample_festival_post.jpg';

const POST_TYPES = [
  {
    id: 'festival',
    name: 'Festival Promo Post',
    tagline: 'AI-generated festival marketing banners',
    description: 'Create structured multi-zone promotional posters for Diwali, Holi, Eid, Independence Day, and any custom occasion. AI fills all the copy, you review and generate in minutes.',
    features: [
      'GPT-4o-mini writes all zone content',
      'Recraft V3 generates the festive scene',
      'Logo, values, products, footer auto-composited',
      'Direct Instagram publishing',
    ],
    sampleImageUrl: sampleFestival,
    route: '/promo-creator/festival',
    badge: 'Available Now',
    available: true,
  },
  {
    id: 'quote',
    name: 'Quote Post',
    tagline: 'AI-crafted quotes with beautiful backgrounds',
    description: 'Generate motivational, brand, or festive quote posts. GPT writes the quote, Recraft creates the background. Ready in seconds.',
    features: [
      'GPT writes a quote matched to your theme',
      'Recraft generates matching abstract background',
      'Your logo and contact auto-composited',
      'Direct Instagram publishing',
    ],
    sampleImageUrl: null,
    route: '/promo-creator/quote',
    badge: 'Available',
    available: true,
  },
  {
    id: 'offer',
    name: 'Offer Announcement',
    tagline: 'Bold discount and offer banners',
    description: 'Create eye-catching offer posts for discounts, new services, events, or any business announcement. GPT polishes the copy, you generate.',
    features: [
      'Enter your offer details — GPT polishes the copy',
      'Recraft generates a clean professional background',
      'Structured 3-zone layout: header, offer, CTA',
      'Custom accent color for your brand',
    ],
    sampleImageUrl: null,
    route: '/promo-creator/offer',
    badge: 'Available',
    available: true,
  },
];

export default function PostTypeLauncher() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 md:px-10 lg:px-20">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            What do you want to create?
          </h1>
          <p className="mt-3 text-gray-500 text-base max-w-xl mx-auto">
            Choose a post type to get started. Each type has its own AI-powered generation flow.
          </p>
        </div>

        {/* Post type cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POST_TYPES.map((type) => (
            <div
              key={type.id}
              className={`bg-white rounded-2xl border-2 shadow-sm flex flex-col transition-all duration-200 ${
                type.available
                  ? 'border-gray-200 hover:border-[#FF6666] hover:shadow-md cursor-pointer'
                  : 'border-gray-100 opacity-70 cursor-default'
              }`}
              onClick={() => type.available && type.route && navigate(type.route)}
            >
              {/* Sample image area */}
              <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl overflow-hidden relative flex items-center justify-center">
                {type.sampleImageUrl ? (
                  <img
                    src={type.sampleImageUrl}
                    alt={type.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-2">
                      {type.id === 'festival' && '🎊'}
                      {type.id === 'quote' && '💬'}
                      {type.id === 'offer' && '🏷️'}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">Sample preview</p>
                  </div>
                )}
                {/* Badge */}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                  type.available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {type.badge}
                </span>
              </div>

              {/* Card body */}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
                  {type.name}
                </h2>
                <p className="text-xs font-semibold text-[#FF6666] mt-0.5 mb-3">
                  {type.tagline}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">
                  {type.description}
                </p>

                {/* Features list (only for available types) */}
                {type.features.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {type.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <div className="mt-5">
                  {type.available ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(type.route);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white font-bold rounded-xl text-sm hover:opacity-95 transition-all shadow-sm"
                    >
                      Create →
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-xl text-sm text-center">
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
