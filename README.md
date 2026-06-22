# AdWhiz — AI-Powered Marketing Automation

AdWhiz is a full-stack web application that lets businesses generate professional, branded social media posts in seconds using AI. Upload your logo once, pick a post type — Festival Promo, Quote/Motivational, or Offer/Announcement — and AdWhiz writes the copy, generates a background with Recraft AI, and composites a pixel-perfect poster that can be published directly to Instagram.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Post Types & How Generation Works](#post-types--how-generation-works)
  - [PostTypeLauncher — The Entry Point](#posttypelauncher--the-entry-point)
  - [Festival Promo Post](#festival-promo-post)
  - [Quote / Motivational Post](#quote--motivational-post)
  - [Offer / Announcement Post](#offer--announcement-post)
  - [Supported Poster Sizes](#supported-poster-sizes)
- [Shared Infrastructure](#shared-infrastructure)
  - [Logo Processor](#logo-processor)
  - [Unified Gallery](#unified-gallery)
- [Instagram Publishing](#instagram-publishing)
- [API Reference](#api-reference)
- [Local Setup Guide](#local-setup-guide)
  - [Prerequisites](#prerequisites)
  - [Getting Your API Keys](#getting-your-api-keys)
  - [Environment Configuration](#environment-configuration)
  - [Running the App](#running-the-app)
- [Data Models](#data-models)
- [Key Features](#key-features)

---

## Project Overview

AdWhiz automates the entire social media content creation pipeline for small businesses:

1. **Brand Setup** — Upload your logo once. AdWhiz processes it (background removal, color extraction) and stores your brand profile.
2. **Post Type Selection** — Navigate to `/promo-creator` to see the launcher. Three post types are available: Festival Promo, Quote Post, and Offer Announcement. Each has its own AI-powered wizard.
3. **AI Content Fill** — GPT-4o-mini writes all copy (headlines, quotes, offer text, CTA) tailored to your brand, sector, and the specific post context.
4. **Background Generation** — Recraft AI (`recraftv3` model) renders a high-quality, textless background matched to the post type. Festival posts use the `recraftv3` default style; Quote and Offer posts force `vector_illustration` for clean, readability-friendly backgrounds.
5. **Poster Compositing** — The server builds SVG zones and composites them on the background using Sharp. Zone structure differs per post type.
6. **Unified Gallery** — All three post types appear together in `PromoGallery`, sorted by creation date, with pill-based filter tabs and type-specific color badges.
7. **Publish or Download** — All three post types support direct Instagram Business publishing and high-res JPEG download.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          REACT FRONTEND (Vite)                               │
│                                                                              │
│   /promo-creator  →  PostTypeLauncher                                        │
│                       ├─ /festival  →  PromoCreator (6-zone wizard)          │
│                       ├─ /quote     →  QuoteCreator (theme + tone wizard)    │
│                       └─ /offer     →  OfferCreator (offer details wizard)   │
│                                                                              │
│   /promo-gallery  →  PromoGallery (unified, filtered, type-badged)           │
│   /settings/social → SocialConnect (Instagram OAuth management)              │
│   Auth pages: Login, Signup, ForgotPassword, SetNewPassword                  │
│                                                                              │
│   All creator routes share:  NavBar + SideBar layout                         │
│   All API calls: Axios + JWT Bearer token                                    │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS BACKEND (Node.js)                               │
│                                                                              │
│  /api/user    UserRoutes     → Auth, JWT, Google OAuth, Password Reset       │
│  /api/logo    LogoRoutes     → Brand profile upload, listing                 │
│  /api/promo   promoRoutes    → Festival post: AI-fill, generate, CRUD        │
│  /api/quote   quoteRoutes    → Quote post: generate, CRUD                    │
│  /api/offer   offerRoutes    → Offer post: generate, CRUD                    │
│  /api/social  socialRoutes   → Instagram OAuth + unified publish             │
│                                                                              │
│  Core Utilities:                                                             │
│  ├─ logoProcessor.js   — bg removal + resize (shared by Quote & Offer)       │
│  ├─ svgBuilder.js      — 6-zone SVG assembly (Festival only)                 │
│  ├─ posterLayout.js    — zone height calculations (Festival only)            │
│  ├─ promptBuilder.js   — Recraft prompt construction (Festival only)         │
│  ├─ festivalPalettes.js — fallback color palettes by festival                │
│  └─ tokenRefresher.js  — nightly cron for Instagram token rotation           │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼──────────────────────┐
          │                         │                      │
┌─────────▼──────────┐  ┌──────────▼──────┐  ┌───────────▼───────────┐
│   MongoDB Atlas     │  │   Cloudinary    │  │   External APIs        │
│                     │  │  (Logo & Image  │  │                        │
│  Collections:       │  │   CDN — public  │  │  Recraft AI recraftv3  │
│  • users            │  │   URLs needed   │  │  OpenAI GPT-4o-mini    │
│  • logos            │  │   for Instagram │  │  Meta Graph API v25.0  │
│  • promoposts       │  │   publishing)   │  │                        │
│  • quoteposts       │  └─────────────────┘  └───────────────────────┘
│  • offerposts       │
│  • socialaccounts   │
│  • imagetemplates   │
└─────────────────────┘
```

**MongoDB DNS fix** — `config/db.js` explicitly sets Google (`8.8.8.8`) and Cloudflare (`1.1.1.1`) as DNS servers before connecting via Mongoose, resolving Atlas connection failures in restricted network environments.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend Framework | React 19, Vite 6 |
| Styling | Tailwind CSS v4 |
| State Management | Redux Toolkit |
| Animations | Framer Motion |
| HTTP Client | Axios |
| Auth (Frontend) | JWT decode, `@react-oauth/google` |
| Backend Runtime | Node.js (v18+) |
| Backend Framework | Express 4 |
| Database ODM | Mongoose 8 (MongoDB) |
| Image Compositing | Sharp 0.34 |
| File Upload | Multer |
| Auth (Backend) | jsonwebtoken, bcryptjs, google-auth-library |
| Email | Nodemailer (Gmail App Password) |
| Scheduling | node-cron |
| AI — Image Gen | Recraft AI (`recraftv3`) |
| AI — Copywriting | OpenAI GPT-4o-mini |
| Image Hosting | Cloudinary |
| Social Publishing | Meta Graph API v25.0 (Instagram Login) |

---

## Repository Structure

```
adwhiz/
├── client/                              # React Frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── PostTypeLauncher.jsx     # 🔑 /promo-creator — post type selection screen
│       │   ├── PromoCreator.jsx         # /promo-creator/festival — 6-zone festival wizard
│       │   ├── QuoteCreator.jsx         # /promo-creator/quote — quote generation wizard
│       │   ├── OfferCreator.jsx         # /promo-creator/offer — offer generation wizard
│       │   ├── PromoGallery.jsx         # 🔑 Unified gallery (all 3 types, filtered)
│       │   ├── GeneratedContent.jsx     # Detailed post view
│       │   ├── FavoriteList.jsx         # Favourited posters
│       │   ├── SocialConnect.jsx        # Instagram account management
│       │   ├── Home.jsx                 # Dashboard
│       │   ├── Login.jsx / Signup.jsx
│       ├── components/
│       │   ├── collectInformation.jsx   # Brand profile setup form
│       │   ├── PublishModal.jsx         # Instagram publish dialog
│       │   ├── PostReady.jsx            # Post preview + download
│       │   ├── NavBar.jsx / SideBar.jsx / Menu.jsx
│       │   ├── forgotPassword.jsx / setNewPassword.jsx
│       └── App.jsx                      # Router — all routes defined here
│
├── server/                              # Node.js / Express Backend
│   ├── config/
│   │   └── db.js                        # MongoDB connect with DNS fallback (1.1.1.1, 8.8.8.8)
│   ├── controllers/
│   │   ├── promoController.js           # 🔑 Festival: AI-fill + 6-zone pipeline
│   │   ├── quoteController.js           # 🔑 Quote: GPT quote + card overlay pipeline
│   │   ├── offerController.js           # 🔑 Offer: GPT copy + 3-zone pipeline
│   │   ├── socialController.js          # Instagram OAuth + unified publish (all 3 types)
│   │   ├── LogoController.js            # Brand profile CRUD
│   │   └── UserController.js            # Auth, registration, Google OAuth
│   ├── models/
│   │   ├── PromoPost.js                 # Festival post schema
│   │   ├── QuotePost.js                 # Quote post schema
│   │   ├── OfferPost.js                 # Offer post schema
│   │   ├── Logo.js                      # Brand profile schema
│   │   ├── SocialAccount.js             # Connected Instagram account + tokens
│   │   ├── User.js                      # User schema
│   │   └── ImageTemplate.js             # Festival template defaults (seed data)
│   ├── routes/
│   │   ├── promoRoutes.js / quoteRoutes.js / offerRoutes.js
│   │   ├── socialRoutes.js / LogoRoutes.js / UserRoutes.js
│   ├── utils/
│   │   ├── logoProcessor.js             # 🔑 Pixel-level bg removal + resize (Quote & Offer)
│   │   ├── svgBuilder.js                # 🔑 SVG zone builder (Festival — 6 zones)
│   │   ├── posterLayout.js              # Zone height math (Festival)
│   │   ├── promptBuilder.js             # Recraft prompt builder (Festival)
│   │   ├── festivalPalettes.js          # Fallback color palettes per festival
│   │   ├── tokenRefresher.js            # Nightly cron: refreshes Instagram tokens
│   │   ├── cloudinary.js / openai.js    # SDK config
│   ├── seed/
│   │   └── templates.js                 # Festival template seed data
│   └── server.js                        # Express entry point
│
└── README.md
```

---

## Post Types & How Generation Works

### PostTypeLauncher — The Entry Point

Route: `/promo-creator`

The launcher is the first screen users see when creating content. It renders a 3-card grid, one card per post type. Each card shows the post type name, tagline, description, a feature checklist, and a "Create →" button.

- Cards marked **Available** navigate to their respective creator route on click.
- The routing pattern (`/promo-creator/festival`, `/promo-creator/quote`, `/promo-creator/offer`) is designed to be extensible — new post types can be added by adding a new entry to the `POST_TYPES` array and a new route in `App.jsx`.
- `PostTypeLauncher.jsx` is a pure frontend component with no backend dependency.

```
/promo-creator
    ├── Festival Promo Post  →  /promo-creator/festival  (PromoCreator.jsx)
    ├── Quote Post           →  /promo-creator/quote     (QuoteCreator.jsx)
    └── Offer Announcement   →  /promo-creator/offer     (OfferCreator.jsx)
```

---

### Festival Promo Post

Route: `/promo-creator/festival` | Backend: `POST /api/promo/generate`

The original and most complex post type. Uses a 6-zone SVG layout composited on a Recraft-generated festive background.

#### 6-Zone Layout

```
┌─────────────────────────────────────────────────────┐
│  ZONE 1 — Header Bar                        (10%)   │  Logo · Tagline · Website/Email
├──────────────────────────┬──────────────────────────┤
│  ZONE 2 LEFT             │  ZONE 2 RIGHT            │
│  Festival name, headline │  Decorative quote card   │  (~42–46% combined)
│  subheading, body, slogan│                          │
├──────────────────────────┴──────────────────────────┤
│  ZONE 3 — Values Row                        (10%)   │  3 circular icon badges (label + sublabel)
├─────────────────────────────────────────────────────┤
│  ZONE 4 — Features Bar                       (8%)   │  4 marketing feature badges with icons
├─────────────────────────────────────────────────────┤
│  ZONE 5 — Product Categories               (8–10%)  │  Product images + names
├─────────────────────────────────────────────────────┤
│  ZONE 6 — Footer Strip                  (remaining) │  4 info columns + optional CTA
└─────────────────────────────────────────────────────┘
```

| Zone | Content | Key Behaviour |
| :--- | :--- | :--- |
| Zone 1 Header | Logo (left), tagline (center), website/email (right) | Logo auto-scaled and composited via Sharp |
| Zone 2 Left | Festival name, headline, subheading, body, slogan | Dynamic text wrapping, auto-fit font sizing |
| Zone 2 Right | Decorative quote box card | Vertically centered; character-limited |
| Zone 3 Values | 3 circular icon badges | Uppercase labels, even column spacing |
| Zone 4 Features | 4 marketing feature badges | Font scales 9–11px based on text length |
| Zone 5 Products | Product category images + names | Cropped to uniform dimensions |
| Zone 6 Footer | 4 configurable columns + optional CTA | Contrast-adaptive text based on luminance check |

#### Festival Generation Pipeline

```
1. LOGO FETCH & PROCESSING
   ├─ Download logo from Cloudinary
   ├─ removeLogoBackground() — pixel-level bg removal
   └─ extractLogoColors() — extract 5 dominant brand colors

2. AI COPYWRITING  [POST /api/promo/ai-fill]
   └─ GPT-4o-mini generates:
      headline, subheading, body, closing slogan, quote box text,
      3 brand values (icon, label, sublabel),
      4 marketing features (icon, text),
      festivalPalette (color scheme for the occasion)

3. BACKGROUND GENERATION  [Recraft AI]
   ├─ buildPrompt() uses: occasion, brand sector, logo colors, festivalPalette
   └─ recraftv3 renders background JPEG (default style)

4. SVG ZONE ASSEMBLY  [svgBuilder.js]
   ├─ calculateZoneHeights(H, W) → proportional heights per aspect ratio
   └─ Build 6 SVG buffers (one per zone), XML-escaped text

5. SHARP COMPOSITING
   ├─ Background resized to target dimensions
   ├─ Each SVG zone composited vertically
   └─ Logo PNG + product images composited into respective zones

6. UPLOAD & SAVE
   ├─ Final JPEG uploaded to Cloudinary
   └─ PromoPost saved to MongoDB
```

---

### Quote / Motivational Post

Route: `/promo-creator/quote` | Backend: `POST /api/quote/generate`

A simpler, elegant post type. A central rounded card with the quote text floats over a dimmed AI-generated background.

#### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│      [Dimmed vector_illustration        │
│         background from Recraft]        │
│                                         │
│   ╔═══════════════════════════════╗     │
│   ║  "  Quote text (italic,       ║     │  Central card — 84% width,
│   ║     bold, wraps dynamically)  ║     │  vertically centered,
│   ║                               ║     │  rounded corners (rx=18),
│   ║  ———————————————              ║     │  drop shadow filter
│   ║  — ATTRIBUTION                ║     │
│   ╚═══════════════════════════════╝     │
│                                         │
├─────────────────────────────────────────┤
│  🌐 website.com   ✉ email@domain.com   │  Contact footer bar (~7.5% height)
└─────────────────────────────────────────┘
```

#### Quote Generation Pipeline

```
1. LOGO PROCESSING  [logoProcessor.js]
   └─ processLogo() — bg removal + resize to 16% of image width

2. AI QUOTE GENERATION  [GPT-4o-mini]
   └─ Generates:
      • quote (max 100 chars, punchy and memorable)
      • attribution (e.g. "— BusinessName", max 30 chars)
      • backgroundPrompt (abstract/atmospheric, no text in scene)
      • quotePalette:
          - cardBg     → rich, saturated card color (never white/pale)
          - textColor  → high-contrast against cardBg
          - accentColor → complementary highlight for quote marks + divider
          - footerBg   → dark variant of cardBg for the contact bar

3. BACKGROUND GENERATION  [Recraft AI]
   └─ Style: vector_illustration (forced — clean, won't clash with card)
   └─ Background dimmed (brightness: 0.85, saturation: 0.9) before compositing

4. QUOTE CARD OVERLAY  [buildQuoteOverlay()]
   ├─ Card width: 84% of image width, vertically centered
   ├─ Quote text: Georgia serif, italic, bold — character-wrap calculated
   │   from (availableWidth / (fontSize × 0.60)) for pixel-accurate wrapping
   ├─ Large decorative opening quote mark (opacity 0.35) top-left of card
   ├─ Accent divider line between quote text and attribution
   ├─ Attribution in uppercase, letter-spaced
   └─ SVG drop shadow filter (feDropShadow, stdDeviation=14) on card

5. CONTACT BAR  [buildQuoteContactBar()]
   └─ Dark footer bar with 🌐 website + ✉ email inline unicode icons

6. SHARP COMPOSITING
   ├─ Layers: dimmedBg → quoteCard → contactBar → logo (top-left, 20px inset)
   └─ Output: JPEG quality 93

7. UPLOAD & SAVE
   ├─ Cloudinary folder: quote_posts/
   └─ QuotePost saved to MongoDB
```

---

### Offer / Announcement Post

Route: `/promo-creator/offer` | Backend: `POST /api/offer/generate`

A bold, high-contrast 3-zone post for discounts, new services, sales, or any business announcement. Users provide raw offer details; GPT polishes the copy.

#### 3-Zone Layout

```
┌─────────────────────────────────────────┐  ←  Zone 1: Contact Header (9%)
│  🌐 website.com    ✉ email@domain.com  │     Dark overlay on background
├─────────────────────────────────────────┤
│                                         │
│   OFFER HEADLINE  (accent color, bold)  │
│   Sub-headline                          │
│   Body detail text                      │  ←  Zone 2: Hero Zone (81%)
│                                         │     Gradient overlay on background
│   ┌─────────────────────────┐           │     (rgba 0→35%→68%)
│   │  Valid Until: Date      │           │
│   └─────────────────────────┘           │     Validity badge: dark bg +
│                                         │     accent outline + accent fill (0.22 opacity)
├─────────────────────────────────────────┤
│  ❯  CALL TO ACTION TEXT                │  ←  Zone 3: CTA Strip (10%)
└─────────────────────────────────────────┘     Solid accent color background
```

**Urgency Ribbon** — If the validity text contains urgency keywords (`today`, `weekend`, `limited`, `ends`, `only`, `last`, `final`, `hurry`), a red rotated banner reading **LIMITED TIME** is automatically composited at the top-right corner of the poster.

#### Offer Generation Pipeline

```
1. LOGO PROCESSING  [logoProcessor.js]
   └─ processLogo() — bg removal + resize; actual height returned for
      precise vertical centering within Zone 1

2. AI COPY POLISH  [GPT-4o-mini]
   └─ User inputs (headline, details, validity, CTA) are polished into:
      • headline (max 30 chars, bold and exciting)
      • subheadline (max 40 chars)
      • body (max 100 chars, 1–2 sentences)
      • validity (max 30 chars)
      • cta (max 25 chars)
      • backgroundPrompt (pure abstract, smooth gradients — NO text, symbols, people)
      • bgStyle: "digital_illustration/flat_design"

3. BACKGROUND GENERATION  [Recraft AI]
   └─ Style: vector_illustration (forced — professional, readable)

4. 3-ZONE SVG ASSEMBLY
   ├─ Zone 1 buildOfferZone1()     — dark rgba(0,0,0,0.55) overlay + contact text
   ├─ Zone 2 buildOfferHeroZone()  — gradient overlay + headline + subheadline +
   │                                  body + validity badge (with dark bg + accent outline)
   └─ Zone 3 buildOfferCTAStrip()  — solid accent color + ❯ arrow icon + CTA text

5. URGENCY DETECTION  [detectUrgency()]
   └─ Scans validity text for urgency keywords
   └─ If triggered: buildUrgencyRibbon() creates a 40°-rotated red SVG banner

6. SHARP COMPOSITING
   ├─ Layers: background → z1 → z2 → z3 → logo → (optional ribbon)
   └─ Logo vertically centered within Zone 1 height

7. UPLOAD & SAVE
   ├─ Cloudinary folder: offer_posts/
   └─ OfferPost saved to MongoDB
```

---

### Supported Poster Sizes

All three post types accept a `size` parameter passed to Recraft:

| Name | Dimensions | Best For |
| :--- | :--- | :--- |
| Square (default) | 1024 × 1024 | Instagram feed |
| Portrait | 1024 × 1365 | Instagram portrait feed |
| Landscape | 1365 × 1024 | Website banners, Facebook |
| Story | 1024 × 1820 | Instagram / WhatsApp Stories |

Festival post zone heights auto-adjust per aspect ratio. Quote and Offer posts derive their zone proportions from the actual image dimensions returned by Recraft.

---

## Shared Infrastructure

### Logo Processor

`server/utils/logoProcessor.js` — used by both Quote and Offer post generators.

```
processLogo(logoUrl, targetWidth)
  ├─ Downloads logo buffer from Cloudinary
  ├─ removeLogoBackground(buffer)
  │     ├─ Samples top-left pixel as background reference color
  │     ├─ Calculates Euclidean distance for every pixel vs. reference
  │     ├─ Pixels within threshold (35) → set alpha to 0 (transparent)
  │     └─ Returns PNG buffer with transparency
  ├─ Resizes to targetWidth (preserving aspect ratio)
  └─ Returns { buffer, width, height }
       └─ height is used by offerController for precise vertical centering
```

> The Festival post generator (`promoController.js`) uses a separate inline logo processing approach and does not use `logoProcessor.js`.

### Unified Gallery

`PromoGallery.jsx` fetches all three post types in parallel and combines them:

```javascript
const [promoRes, quoteRes, offerRes] = await Promise.all([
  axios.get('/api/promo/list'),
  axios.get('/api/quote/list'),
  axios.get('/api/offer/list')
]);
// Each post tagged with: type: 'festival' | 'quote' | 'offer'
// Combined and sorted descending by createdAt
```

**Filter tabs** — "All Banners", "Festival Promos", "Quote Posts", "Offer Posts" — with per-tab post counts.

**Type badges** — Purple for Festival, Blue for Quote, Emerald for Offer.

**Actions** (Favorite, Download, Instagram Publish, Delete) all route dynamically to the correct backend endpoint based on `post.type`:
- `festival` → `/api/promo/...`
- `quote` → `/api/quote/...`
- `offer` → `/api/offer/...`

---

## Instagram Publishing

AdWhiz uses the **Instagram API with Instagram Login** (Meta Graph API v25.0), which supports Instagram Business and Creator accounts directly — no Facebook Page required.

### OAuth Flow

```
User clicks "Connect Instagram"
        │
        ▼
GET /api/social/instagram/auth-url
        │  Returns Meta OAuth URL with:
        │  client_id, redirect_uri, state: userId
        │  scope: instagram_business_basic, instagram_business_content_publish
        │
        ▼
User authorizes on Meta's consent screen
        │
        ▼
Meta redirects → GET /api/social/instagram/callback?code=...&state=userId
        │
        ▼
Server: code → short-lived token → long-lived token (60 days)
        │
        ▼
Server fetches /me (igUserId, igUsername, profilePicUrl)
        │
        ▼
SocialAccount upserted in MongoDB
Redirect → /settings/social?connected=instagram
```

### Publishing Flow (all 3 post types)

The `publishToInstagram` controller in `socialController.js` resolves the post's image URL by checking all three models in sequence:

```
POST /api/social/publish/instagram  { promoPostId, caption }
        │
        ▼
1. Find post in PromoPost → if not found, try QuotePost → if not found, try OfferPost
2. Get generatedImageUrl (Cloudinary public URL)
3. Fetch SocialAccount → accessToken, igUserId
4. POST graph.instagram.com/{igUserId}/media
   { image_url, caption, access_token } → containerId
5. Poll container status (up to 5 retries) until FINISHED
6. POST graph.instagram.com/{igUserId}/media_publish
   { creation_id: containerId } → igMediaId
7. Save igMediaId + publishedAt to the correct model's socialPosts[]
        │
        ▼
Response: { success: true, igMediaId }
```

### Automatic Token Refresh

A `node-cron` job runs **daily at 3:00 AM**. It finds all `SocialAccount` records expiring within 10 days (not refreshed in the last 24 hours) and calls `graph.instagram.com/refresh_access_token` to get a new 60-day token.

---

## API Reference

All protected routes require: `Authorization: Bearer <jwt_token>`

### User & Auth

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/user/signup` | Public | Register with email + password |
| POST | `/api/user/login` | Public | Login, receive JWT |
| POST | `/api/user/google` | Public | Google OAuth login / register |
| POST | `/api/user/forgot-password` | Public | Send password reset email |
| POST | `/api/user/reset-password` | Public | Set new password via reset token |

### Brand Profiles (Logo)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/logo/add` | JWT | Upload logo + brand profile |
| GET | `/api/logo/list` | JWT | List all brand profiles |

### Festival Promo (`/api/promo`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/promo/templates` | JWT | List festival templates |
| POST | `/api/promo/ai-fill` | JWT | AI-generate copy + color palette |
| POST | `/api/promo/generate` | JWT | Run full 6-zone poster generation |
| GET | `/api/promo/list` | JWT | List user's festival posters |
| GET | `/api/promo/download/:id` | JWT | Download as attachment |
| PATCH | `/api/promo/favorite/:id` | JWT | Toggle favorite |
| POST | `/api/promo/upload-product-image` | JWT | Upload product image to Cloudinary |

### Quote Post (`/api/quote`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/quote/generate` | JWT | Generate quote post (GPT + Recraft + composite) |
| GET | `/api/quote/list` | JWT | List user's quote posts |
| DELETE | `/api/quote/delete/:id` | JWT | Delete post + Cloudinary image |
| PATCH | `/api/quote/favorite/:id` | JWT | Toggle favorite |
| GET | `/api/quote/download/:id` | JWT | Download as attachment |

### Offer Post (`/api/offer`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/offer/generate` | JWT | Generate offer post (GPT + Recraft + composite) |
| GET | `/api/offer/list` | JWT | List user's offer posts |
| DELETE | `/api/offer/delete/:id` | JWT | Delete post + Cloudinary image |
| PATCH | `/api/offer/favorite/:id` | JWT | Toggle favorite |
| GET | `/api/offer/download/:id` | JWT | Download as attachment |

### Social / Instagram (`/api/social`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/social/instagram/auth-url` | JWT | Get Meta OAuth URL |
| GET | `/api/social/instagram/callback` | Public | OAuth callback — token exchange |
| GET | `/api/social/account` | JWT | Get connected Instagram account |
| DELETE | `/api/social/disconnect` | JWT | Disconnect Instagram |
| POST | `/api/social/publish/instagram` | JWT | Publish any post type to Instagram |

---

## Local Setup Guide

### Prerequisites

- **Node.js** v18 or higher ([nodejs.org](https://nodejs.org))
- **npm** v9 or higher (bundled with Node.js)
- **MongoDB** — [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier or local install
- A modern browser

---

### Getting Your API Keys

#### 1. Recraft AI (Background Image Generation)

1. Sign up at [recraft.ai](https://recraft.ai).
2. Go to account settings → API section → generate an API key.
3. Copy it → `RECRAFT_API_KEY`.

> AdWhiz uses the `recraftv3` model. Recraft provides a free tier to get started.

---

#### 2. OpenAI (Copywriting — all 3 post types)

1. Go to [platform.openai.com](https://platform.openai.com) and create an account.
2. Navigate to **API Keys → Create new secret key**.
3. Copy it → `OPENAI_API_KEY`.

> GPT-4o-mini is used across all post types. Billing must be enabled; costs are very low.

---

#### 3. Cloudinary (Logo & Generated Image Hosting)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the Dashboard, copy:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

> Cloudinary public URLs are required for Instagram publishing (Meta fetches the image by URL). The free tier is sufficient for development.

---

#### 4. MongoDB

**Option A — MongoDB Atlas (recommended):**
1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 cluster**.
3. Under **Database Access**, create a user with read/write permissions.
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for development).
5. Click **Connect → Drivers**, copy the connection string, replace `<password>`.
6. Set as `MONGO_URI`.

**Option B — Local MongoDB:**
1. Install MongoDB Community from [mongodb.com](https://www.mongodb.com/try/download/community).
2. Start: `mongod --dbpath /data/db`
3. Set `MONGO_URI=mongodb://localhost:27017/adwhiz`.

> **Note:** The app's `db.js` automatically sets Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) as DNS fallbacks before connecting, which resolves Atlas hostname resolution failures in some network environments.

---

#### 5. Google OAuth (Optional — Google Login)

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a project → **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Application type: **Web application**.
4. Authorized JavaScript origins: `http://localhost:5173`
5. Authorized redirect URIs: `http://localhost:5173`
6. Copy the **Client ID** → used as both `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client).

---

#### 6. Gmail (Password Reset Emails)

1. Use any Gmail account.
2. Enable **2-Step Verification** on the account.
3. Go to **Google Account → Security → App Passwords**.
4. Generate an App Password for "Mail" (16-character code).
5. Set `GMAIL_USER=your@gmail.com` and `GMAIL_PASS=the_16_char_code`.

---

#### 7. Instagram / Meta API (Direct Publishing)

This is the most involved setup. AdWhiz uses the **Instagram API with Instagram Login** — no Facebook Page required.

**Step 1 — Create a Meta Developer App**

1. Go to [developers.facebook.com](https://developers.facebook.com), log in.
2. Click **My Apps → Create App**.
3. Use case: **Other → Next**. App type: **Business → Next**.
4. Name the app (e.g. "AdWhiz Local"), enter your email → **Create App**.

**Step 2 — Add the Instagram Product**

1. In the App Dashboard, click **Add Product → Instagram → Set up**.
2. From the left sidebar, click **API setup with Instagram Login**.
3. Copy your **Instagram App ID** → `INSTAGRAM_APP_ID`
4. Copy your **Instagram App Secret** → `INSTAGRAM_APP_SECRET`

**Step 3 — Configure OAuth Redirect URI**

1. In the Instagram product settings, find **Valid OAuth Redirect URIs**.
2. Add: `http://localhost:4000/api/social/instagram/callback`
3. Click **Save Changes**.

**Step 4 — Add a Test Account**

In development mode, only accounts explicitly added as testers can authenticate.

1. In the App Dashboard, go to **Roles → Instagram Testers**.
2. Add your Instagram Business or Creator account as a tester.
3. Log into that Instagram account and accept the tester invitation (check Instagram's notification center).

> **Important:** Your Instagram account must be a **Business** or **Creator** account (not Personal). Switch in the Instagram app: **Settings → Account → Switch to Professional Account**.

**Step 5 — For Production**

When ready to go live with other users' accounts:
1. Go to **App Review → Permissions and Features**.
2. Request `instagram_business_basic` and `instagram_business_content_publish`.
3. Submit with a screen recording of your publishing flow.

---

### Environment Configuration

**Server — create `server/.env`:**

```bash
cd server && cp .env.example .env
```

```properties
# Server
PORT=4000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/adwhiz

# Auth
JWT_SECRET=generate_with__node_-e_"console.log(require('crypto').randomBytes(64).toString('hex'))"
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI
RECRAFT_API_KEY=your_recraft_key
OPENAI_API_KEY=your_openai_key

# Email
GMAIL_USER=your@gmail.com
GMAIL_PASS=your_16_char_app_password

# Instagram
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:4000/api/social/instagram/callback
CLIENT_URL=http://localhost:5173
```

**Client — create `client/.env`:**

```bash
cd client && cp .env.example .env
```

```properties
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

### Running the App

**Terminal 1 — Backend:**

```bash
cd server
npm install
npm run dev
```

Expected output:
```
Server running on port 4000
MongoDB Connected
[TokenRefresher] Token refresh cron job scheduled
```

**Terminal 2 — Frontend:**

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

**First-time workflow:**
1. Create an account or sign in with Google.
2. Go to **Brand Setup** and upload your business logo with your details.
3. Navigate to **Create Post** (`/promo-creator`) to see the launcher.
4. Choose a post type and follow the wizard.
5. After generation, Download or connect Instagram and Publish.

---

## Data Models

### User
```
_id, name, email, password (bcrypt), googleId, createdAt
```

### Logo (Brand Profile)
```
_id, user (ref), name, sector, address, website, email,
images: { url, publicId }   ← Cloudinary
createdAt
```

> `unique` constraint on `name` was intentionally removed — multiple brand profiles with the same business name are allowed.

### PromoPost (Festival)
```
_id, user (ref), logo (ref), template (ref),
occasion, size,
userOverrides: {
  heroContent:        { headline, subheading, bodyMessage, closingSlogan, rightBoxQuote },
  valuesRow:          [{ icon, label, sublabel }],          // 3 items
  featuresBar:        [{ icon, text }],                     // 4 items
  productCategories:  [{ imageUrl, cloudinaryPublicId, name }],
  footerColumns:      [{ icon, lines[], highlight }]        // 4 items
},
generatedImageUrl,   ← Cloudinary
favorite (bool),
socialPosts: [{ platform, externalPostId, caption, publishedAt }],
createdAt, updatedAt
```

### QuotePost
```
_id, user (ref), logo (ref),
theme,                    ← e.g. "growth", "Monday motivation"
tone,                     ← inspirational | witty | warm | bold
quoteText,
attribution,              ← e.g. "— BusinessName"
size,
generatedImageUrl,        ← Cloudinary (folder: quote_posts/)
favorite (bool),
socialPosts: [{ platform, externalPostId, caption, publishedAt }],
createdAt, updatedAt
```

### OfferPost
```
_id, user (ref), logo (ref),
offerHeadline,            ← raw user input (GPT polishes it)
offerDetails,
validity,                 ← e.g. "Valid till Sunday"
cta,                      ← e.g. "Visit Us Today"
accentColor,              ← hex, default #FFD700
size,
generatedImageUrl,        ← Cloudinary (folder: offer_posts/)
favorite (bool),
socialPosts: [{ platform, externalPostId, caption, publishedAt }],
createdAt, updatedAt
```

### SocialAccount
```
_id, user (ref), platform ('instagram'),
igUserId, igUsername, profilePicUrl,
accessToken,              ← long-lived, 60-day Instagram token
tokenExpiresAt,
lastRefreshedAt,          ← used by cron to skip recently refreshed accounts
createdAt
```

### ImageTemplate (Festival seed data)
```
_id, name, occasion,
heroContent, valuesRow[], featuresBar[], productCategories[], footerColumns[],
isActive
```

---

## Key Features

**3 AI-powered post types from one launcher**
- Festival Promo: 6-zone structured poster for occasions and festivals.
- Quote Post: Central card overlay with AI-written quote, dynamic text wrapping, and drop shadow, over a dimmed background.
- Offer Announcement: 3-zone layout with AI-polished copy, urgency ribbon auto-trigger, and customizable accent color.

**Shared logo processing pipeline**
- `logoProcessor.js` handles pixel-level background removal via Euclidean color-distance thresholding on the top-left pixel, then resizes and returns the exact composited height — used by Quote and Offer generators for precise logo placement.

**AI content generation**
- GPT-4o-mini generates all text: quotes, offer headlines, festival copy, color palettes, background prompts. Each post type has its own system prompt and response schema.
- Recraft AI (`recraftv3`) generates all backgrounds. Quote and Offer posts force `vector_illustration` style for clean, non-distracting scenes.

**Smart compositing details**
- Quote post backgrounds are dimmed (brightness 0.85, saturation 0.9) before the card is overlaid, ensuring readability regardless of palette.
- Offer posts detect urgency keywords in validity text and automatically add a rotated red "LIMITED TIME" ribbon.
- All SVG text is XML-escaped and processed through a `toUpperCase()`-before-escape pattern to prevent entity corruption on capitalized text.

**Unified gallery with type filtering**
- All three post types are fetched in parallel, merged, and sorted by `createdAt` descending.
- Pill filter tabs with per-type counts. Type-specific color badges (purple/blue/emerald).
- Favorite, Download, Delete, and Instagram Publish actions all route to the correct API endpoint based on `post.type`.

**Instagram publishing (all post types)**
- `publishToInstagram` resolves the post by checking PromoPost → QuotePost → OfferPost in sequence, so a single endpoint handles all three types.
- 3-step Meta publishing flow: create container → poll status → publish.
- Nightly cron auto-refreshes tokens expiring within 10 days.
