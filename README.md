# AdWhiz — AI-Powered Marketing Automation

AdWhiz is a full-stack web application that lets businesses generate professional, branded social media posts in seconds using AI — and publish them directly to Instagram. It features three AI-powered post types, a Razorpay subscription billing system with three plan tiers, and automatic plan enforcement (usage metering, watermarking, feature gating) across the entire generation pipeline.

---

## Table of Contents

- [Subscription Plans](#subscription-plans)
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
- [Subscription & Billing System](#subscription--billing-system)
  - [Plan Enforcement Architecture](#plan-enforcement-architecture)
  - [Usage Metering Middleware](#usage-metering-middleware)
  - [Feature Gating Middleware](#feature-gating-middleware)
  - [Watermark System](#watermark-system)
  - [Razorpay Integration](#razorpay-integration)
  - [Webhook Handler](#webhook-handler)
  - [Frontend Billing Components](#frontend-billing-components)
- [Shared Infrastructure](#shared-infrastructure)
  - [Logo Processor](#logo-processor)
  - [Unified Gallery](#unified-gallery)
- [Instagram Publishing](#instagram-publishing)
- [API Reference](#api-reference)
- [Local Setup Guide](#local-setup-guide)
  - [Prerequisites](#prerequisites)
  - [Getting Your API Keys](#getting-your-api-keys)
  - [Setting Up Razorpay Subscriptions](#setting-up-razorpay-subscriptions)
  - [Environment Configuration](#environment-configuration)
  - [Running the App](#running-the-app)
  - [Testing the Payment Flow](#testing-the-payment-flow)
- [Data Models](#data-models)
- [Key Features](#key-features)

---

## Subscription Plans

| Feature | Free | Basic (₹199/mo) | Pro (₹499/mo) |
| :--- | :---: | :---: | :---: |
| Posts per month | 5 | 100 | Unlimited |
| Watermark on output | ✅ Yes | ❌ No | ❌ No |
| Instagram publishing | ❌ | ✅ | ✅ |
| All post templates | ❌ | ✅ | ✅ |
| Priority generation | ❌ | ❌ | ✅ |
| Multiple brands | ❌ (1) | ❌ (1) | ✅ Unlimited |
| Reel Generator | ❌ | ❌ | ✅ (coming soon) |
| Razorpay billing | — | Monthly | Monthly |

---

## Project Overview

AdWhiz automates the full social media content creation pipeline for small businesses:

1. **Brand Setup** — Upload your logo once. AdWhiz removes the background, extracts brand colors, and stores the brand profile.
2. **Post Type Selection** — Visit `/promo-creator` to see the launcher. Three post types are live: Festival Promo, Quote Post, and Offer Announcement.
3. **Plan Check** — Before any generation starts, `usageMiddleware` checks the user's monthly quota and resets it if a new billing window has begun. Instagram publishing is additionally gated by `planFeatureMiddleware`.
4. **AI Content + Background** — GPT-4o-mini writes all copy; Recraft AI (`recraftv3`) generates a textless background matched to the post type.
5. **Compositing** — The server builds SVG zones and composites them onto the background with Sharp. If the user is on the Free plan, `applyWatermark()` is called on the final buffer before upload.
6. **Usage Increment** — Only after a successful generation does `incrementUsage()` add 1 to `user.monthlyUsage.count`. Failed AI calls never consume quota.
7. **Unified Gallery** — All three post types appear together in `PromoGallery`, sorted by creation date, with type-specific badges and filter tabs.
8. **Publish or Download** — Basic and Pro users can publish directly to Instagram. Free users see a plan-gate error with a redirect to `/pricing`.

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
│   /pricing           →  Pricing.jsx (plan cards + Razorpay Checkout modal)   │
│   /settings/billing  →  BillingSettings.jsx (usage bar + cancel)             │
│   /promo-gallery     →  PromoGallery (unified, filtered, type-badged)        │
│   /settings/social   →  SocialConnect (Instagram OAuth)                      │
│                                                                              │
│   Hooks:   useSubscription — fetches plan/usage, shared across screens       │
│   Utils:   planGateError.js — handles 403 plan-gate responses with toast     │
│   All API calls: Axios + JWT Bearer token                                    │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS BACKEND (Node.js)                               │
│                                                                              │
│  ROUTE ORDER IN server.js (order matters for webhook):                       │
│  ① /api/webhooks  express.raw() + webhookRoutes  ← BEFORE express.json()    │
│  ② express.json() global body parser                                         │
│  ③ All other routes                                                           │
│                                                                              │
│  /api/user         UserRoutes       Auth, JWT, Google OAuth, Password Reset  │
│  /api/logo         LogoRoutes       Brand profile upload, listing            │
│  /api/promo        promoRoutes      Festival: AI-fill, generate, CRUD        │
│  /api/quote        quoteRoutes      Quote: generate, CRUD                    │
│  /api/offer        offerRoutes      Offer: generate, CRUD                    │
│  /api/subscription subscriptionRoutes  Plans, create, verify, cancel        │
│  /api/social       socialRoutes     Instagram OAuth + unified publish        │
│  /api/webhooks     webhookRoutes    Razorpay event handler (raw body)        │
│                                                                              │
│  Middleware chain on all /generate routes:                                   │
│  userMiddleware → checkUsageLimit → [controller: generate → applyWatermark? │
│                                       → upload → incrementUsage]            │
│                                                                              │
│  Middleware chain on /publish/instagram:                                     │
│  userMiddleware → requireFeature('instagramPublishing') → publishToInstagram │
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
│  • promoposts       │  │   publishing)   │  │  Razorpay Node SDK     │
│  • quoteposts       │  └─────────────────┘  └───────────────────────┘
│  • offerposts       │
│  • socialaccounts   │
│  • imagetemplates   │
└─────────────────────┘
```

**MongoDB DNS fix** — `config/db.js` sets Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) as DNS servers before connecting via Mongoose, resolving Atlas hostname resolution failures in restricted network environments.

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
| Payment / Billing | Razorpay Node SDK (`razorpay`) |
| Social Publishing | Meta Graph API v25.0 (Instagram Login) |

---

## Repository Structure

```
adwhiz/
├── client/
│   └── src/
│       ├── pages/
│       │   ├── PostTypeLauncher.jsx     # /promo-creator — post type picker
│       │   ├── PromoCreator.jsx         # /promo-creator/festival
│       │   ├── QuoteCreator.jsx         # /promo-creator/quote
│       │   ├── OfferCreator.jsx         # /promo-creator/offer
│       │   ├── Pricing.jsx              # 🔑 /pricing — plan cards + Razorpay Checkout
│       │   ├── BillingSettings.jsx      # 🔑 /settings/billing — usage bar + cancel
│       │   ├── PromoGallery.jsx         # Unified gallery (all 3 types, filtered)
│       │   ├── SocialConnect.jsx        # Instagram account management
│       │   ├── GeneratedContent.jsx / FavoriteList.jsx / Home.jsx
│       │   └── Login.jsx / Signup.jsx
│       ├── components/
│       │   ├── collectInformation.jsx   # Brand profile setup form
│       │   ├── PublishModal.jsx         # Instagram publish dialog (plan-gated)
│       │   ├── PostReady.jsx / NavBar.jsx / SideBar.jsx / Menu.jsx
│       │   └── forgotPassword.jsx / setNewPassword.jsx
│       ├── hooks/
│       │   ├── useSubscription.js       # 🔑 Fetches plan + usage, shared hook
│       │   └── useScreenSize.js
│       ├── utils/
│       │   └── planGateError.js         # 🔑 Handles 403 plan-gate errors with toast + redirect
│       └── App.jsx                      # All routes including /pricing, /settings/billing
│
├── server/
│   ├── config/
│   │   ├── plans.js                     # 🔑 Plan definitions — single source of truth
│   │   └── db.js                        # MongoDB + DNS fallback
│   ├── controllers/
│   │   ├── promoController.js           # Festival: AI-fill + 6-zone pipeline
│   │   ├── quoteController.js           # Quote: GPT quote + card overlay
│   │   ├── offerController.js           # Offer: GPT copy + 3-zone layout
│   │   ├── subscriptionController.js    # 🔑 Plan list, create, verify, cancel
│   │   ├── webhookController.js         # 🔑 Razorpay webhook event router
│   │   ├── socialController.js          # Instagram OAuth + unified publish
│   │   ├── LogoController.js / UserController.js
│   ├── middleware/
│   │   ├── usageMiddleware.js           # 🔑 Monthly quota check + reset + increment
│   │   ├── planFeatureMiddleware.js     # 🔑 Boolean feature gate (instagramPublishing, etc.)
│   │   ├── UserMiddleware.js            # JWT verification
│   │   └── uploadMiddleware.js          # Multer config
│   ├── models/
│   │   ├── User.js                      # 🔑 Extended with plan, usage, Razorpay fields
│   │   ├── PromoPost.js / QuotePost.js / OfferPost.js
│   │   ├── Logo.js / SocialAccount.js / ImageTemplate.js
│   ├── routes/
│   │   ├── subscriptionRoutes.js        # 🔑 /api/subscription/*
│   │   ├── webhookRoutes.js             # 🔑 /api/webhooks/razorpay
│   │   ├── promoRoutes.js / quoteRoutes.js / offerRoutes.js
│   │   └── socialRoutes.js / LogoRoutes.js / UserRoutes.js
│   ├── utils/
│   │   ├── razorpay.js                  # 🔑 Lazy-init Proxy wrapper (key-independent boot)
│   │   ├── watermark.js                 # 🔑 SVG diagonal watermark compositor
│   │   ├── logoProcessor.js             # Pixel bg removal + resize (Quote & Offer)
│   │   ├── svgBuilder.js / posterLayout.js / promptBuilder.js
│   │   ├── festivalPalettes.js / tokenRefresher.js
│   │   ├── cloudinary.js / openai.js
│   │   └── testSubscription.js          # Standalone unit tests (7 tests, node-only)
│   └── server.js                        # Express entry — webhook raw body BEFORE json()
```

---

## Post Types & How Generation Works

### PostTypeLauncher — The Entry Point

Route: `/promo-creator`

A 3-card grid where users choose their post type. Each card shows name, tagline, description, a feature checklist, and a "Create →" button. All three types are currently live (`available: true`). The routing pattern is extensible — new types are added via a new entry in `POST_TYPES` and a new route in `App.jsx`.

```
/promo-creator
    ├── Festival Promo Post  →  /promo-creator/festival
    ├── Quote Post           →  /promo-creator/quote
    └── Offer Announcement   →  /promo-creator/offer
```

---

### Festival Promo Post

Route: `/promo-creator/festival` | Backend: `POST /api/promo/generate`

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

#### Festival Generation Pipeline

```
checkUsageLimit middleware runs first — 403 if quota exhausted

1. LOGO FETCH & PROCESSING
   └─ removeLogoBackground() + extractLogoColors() (5 dominant colors)

2. AI COPYWRITING  [POST /api/promo/ai-fill — separate step in wizard]
   └─ GPT-4o-mini: headline, subheading, body, slogan, quote box text,
      3 brand values, 4 features, festivalPalette

3. BACKGROUND GENERATION  [Recraft recraftv3, default style]
   └─ buildPrompt() uses: occasion, sector, logo colors, festivalPalette

4. SVG ZONE ASSEMBLY  [svgBuilder.js]
   └─ 6 SVG buffers, XML-escaped text, dynamic font sizing

5. SHARP COMPOSITING
   └─ Background + zones + logo + product images → finalImageBuffer

6. WATERMARK CHECK
   └─ req.userPlan.watermark === true  →  applyWatermark(finalImageBuffer)
   └─ Basic/Pro: skip watermark

7. UPLOAD & SAVE
   └─ Cloudinary upload → PromoPost saved to MongoDB
   └─ incrementUsage(userId) called only after successful upload
```

---

### Quote / Motivational Post

Route: `/promo-creator/quote` | Backend: `POST /api/quote/generate`

#### Layout

```
┌─────────────────────────────────────────┐
│      [Dimmed vector_illustration        │
│         background from Recraft]        │
│                                         │
│   ╔═══════════════════════════════╗     │
│   ║  "  Quote text (italic,       ║     │  Central card — 84% width,
│   ║     bold, wraps dynamically)  ║     │  vertically centered, rx=18,
│   ║  ———————————————              ║     │  feDropShadow filter
│   ║  — ATTRIBUTION                ║     │
│   ╚═══════════════════════════════╝     │
│                                         │
├─────────────────────────────────────────┤
│  🌐 website.com   ✉ email@domain.com   │  Contact bar (7.5% height)
└─────────────────────────────────────────┘
```

#### Quote Generation Pipeline

```
checkUsageLimit middleware runs first

1. LOGO PROCESSING  [logoProcessor.js]
2. AI QUOTE GENERATION  [GPT-4o-mini]
   └─ quote, attribution, backgroundPrompt,
      quotePalette: { cardBg, textColor, accentColor, footerBg }
3. BACKGROUND GENERATION  [Recraft — vector_illustration style, forced]
4. BACKGROUND DIMMING  [brightness: 0.85, saturation: 0.9]
5. QUOTE CARD OVERLAY  [buildQuoteOverlay()]
   └─ Dynamic char-wrap, feDropShadow, accent divider
6. CONTACT BAR  [buildQuoteContactBar()]
7. SHARP COMPOSITING  [dimmedBg → card → bar → logo]
8. WATERMARK CHECK  →  applyWatermark() if Free plan
9. UPLOAD & SAVE  →  incrementUsage() after success
```

---

### Offer / Announcement Post

Route: `/promo-creator/offer` | Backend: `POST /api/offer/generate`

#### 3-Zone Layout

```
┌─────────────────────────────────────────┐  Zone 1: Contact Header (9%)
│  🌐 website.com    ✉ email@domain.com  │  Dark rgba(0,0,0,0.55) overlay
├─────────────────────────────────────────┤
│   OFFER HEADLINE (accent color, bold)   │
│   Sub-headline                          │  Zone 2: Hero Zone (81%)
│   Body detail                           │  Gradient overlay (rgba)
│   ┌──────────────────────────┐          │  Validity badge: dark bg +
│   │  Valid Until: Date       │          │  accent outline
│   └──────────────────────────┘          │
├─────────────────────────────────────────┤
│  ❯  CALL TO ACTION TEXT                │  Zone 3: CTA Strip (10%)
└─────────────────────────────────────────┘  Solid accent color background
```

**Urgency Ribbon** — If validity text contains `today`, `weekend`, `limited`, `ends`, `only`, `last`, `final`, or `hurry`, a red 40°-rotated **LIMITED TIME** ribbon is composited at the top-right corner automatically.

#### Offer Generation Pipeline

```
checkUsageLimit middleware runs first

1. LOGO PROCESSING  [logoProcessor.js — returns height for precise centering]
2. AI COPY POLISH  [GPT-4o-mini — polishes user's raw input into clean copy]
3. BACKGROUND GENERATION  [Recraft — vector_illustration style, forced]
4. 3-ZONE SVG ASSEMBLY  [buildOfferZone1 + buildOfferHeroZone + buildOfferCTAStrip]
5. URGENCY DETECTION  [detectUrgency() → buildUrgencyRibbon() if triggered]
6. SHARP COMPOSITING  [bg → z1 → z2 → z3 → logo → optional ribbon]
7. WATERMARK CHECK  →  applyWatermark() if Free plan
8. UPLOAD & SAVE  →  incrementUsage() after success
```

---

### Supported Poster Sizes

| Name | Dimensions | Best For |
| :--- | :--- | :--- |
| Square (default) | 1024 × 1024 | Instagram feed |
| Portrait | 1024 × 1365 | Instagram portrait feed |
| Landscape | 1365 × 1024 | Website banners, Facebook |
| Story | 1024 × 1820 | Instagram / WhatsApp Stories |

---

## Subscription & Billing System

### Plan Enforcement Architecture

```
server/config/plans.js  ←  Single source of truth for all plan limits
        │
        ├─ usageMiddleware.js     — quantitative gate (posts/month counter)
        │       used on: POST /api/promo/generate
        │                POST /api/quote/generate
        │                POST /api/offer/generate
        │
        ├─ planFeatureMiddleware.js — boolean feature gate
        │       used on: POST /api/social/publish/instagram
        │                    (requireFeature('instagramPublishing'))
        │
        └─ watermark.js          — output-level enforcement
                called by: all three generation controllers,
                           AFTER compositing, BEFORE Cloudinary upload,
                           only when req.userPlan.watermark === true
```

`plans.js` defines three plan objects (`free`, `basic`, `pro`) each with: `postsPerMonth`, `watermark`, `instagramPublishing`, `maxBrands`, `priorityGeneration`, `reelGenerator`, `price`, `razorpayPlanId`. The `getPlan(key)` helper always returns a valid plan (defaulting to `free`), so a stale or missing plan key on a user record never crashes a request.

---

### Usage Metering Middleware

`server/middleware/usageMiddleware.js`

```
checkUsageLimit(req, res, next)
  ├─ Looks up User from JWT
  ├─ If now >= monthlyUsage.resetAt → resets count to 0, sets next resetAt (+1 month)
  ├─ Resolves plan via getPlan(user.plan)
  ├─ If count >= plan.postsPerMonth → 403  { code: 'USAGE_LIMIT_REACHED', ... }
  └─ Attaches req.userPlan + req.userDoc for downstream use (no extra DB query needed)

incrementUsage(userId)
  └─ $inc { monthlyUsage.count: 1 } — called only after successful generation+upload
     so failed AI calls never consume a user's quota slot
```

---

### Feature Gating Middleware

`server/middleware/planFeatureMiddleware.js`

```
requireFeature(featureKey) → Express middleware
  ├─ Reads req.userDoc (if already set by checkUsageLimit) or queries User
  ├─ Resolves plan via getPlan(user.plan)
  ├─ If plan[featureKey] === false → 403  { code: 'FEATURE_NOT_AVAILABLE', ... }
  └─ Attaches req.userPlan + req.userDoc
```

Currently gated features: `instagramPublishing` (Free plan cannot publish). The `reelGenerator` feature key is defined in `plans.js` and ready to gate any future Reel Generator route without schema changes.

---

### Watermark System

`server/utils/watermark.js`

Free-plan generated images carry a semi-transparent diagonal watermark applied as the last step before Cloudinary upload, so it sits on top of all composited layers regardless of post type.

```
buildWatermarkSvg(width, height)
  ├─ Tiled diagonal "AdWhiz" text across the entire image
  │   font-size: max(18, width × 0.035), fill-opacity: 0.16
  │   tile spacing: fontSize × 7 (W) / fontSize × 5 (H)
  └─ One larger bold "AdWhiz" bottom-right (fill-opacity: 0.55, font-size: width × 0.045)

applyWatermark(imageBuffer) → Promise<Buffer>
  └─ sharp(imageBuffer).composite([watermarkSvg]).jpeg({ quality: 93 }).toBuffer()
```

Usage in controllers (all three post types, same pattern):
```javascript
const outputBuffer = req.userPlan?.watermark
  ? await applyWatermark(finalBuffer)
  : finalBuffer;
// then upload outputBuffer to Cloudinary
// then incrementUsage(userId)
```

---

### Razorpay Integration

`server/utils/razorpay.js` — Lazy-init Proxy

The Razorpay SDK is wrapped in a JavaScript `Proxy` so the server can start and serve all non-payment routes even when `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are not set in `.env`. The SDK instance is only created on the first property access; if keys are missing at that point, a descriptive error is thrown rather than crashing startup.

```javascript
// First access to razorpay.subscriptions, razorpay.customers, etc.
// checks for keys and instantiates exactly once.
const razorpay = new Proxy({}, handler);
```

**Subscription lifecycle — `subscriptionController.js`:**

```
POST /api/subscription/create   { planKey: "basic" | "pro" }
  ├─ Creates or reuses a Razorpay customer (stored as user.razorpayCustomerId)
  ├─ Creates Razorpay Subscription (total_count: 120 ≈ 10 years, auto-renews)
  │   notes: { userId, planKey } — stamped here so webhook can resolve user
  ├─ Saves subscription.id + status "created" to User
  └─ Returns { subscriptionId, razorpayKeyId, planName, amount }
       → frontend passes subscriptionId to Razorpay Checkout JS

POST /api/subscription/verify   { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
  ├─ Verifies HMAC signature using RAZORPAY_KEY_SECRET
  ├─ Fetches subscription from Razorpay to get planKey from notes (never trusts client)
  ├─ Sets user.plan, subscriptionStatus: "active", currentPeriodEnd
  └─ Fast-path confirmation — webhook is still the source of truth

POST /api/subscription/cancel   { immediate?: boolean }
  ├─ immediate: false (default) → cancel_at_cycle_end: 1
  │   User keeps paid features until period ends; webhook sets plan → "free" then
  └─ immediate: true → cancel_at_cycle_end: 0, plan set to "free" right now

GET /api/subscription/plans     — plan catalogue for pricing page (no hardcoded prices in frontend)
GET /api/subscription/me        — current plan + usage + features for billing dashboard
```

---

### Webhook Handler

`server/controllers/webhookController.js`

The webhook route is mounted in `server.js` with `express.raw({ type: 'application/json' })` **before** `express.json()` — Razorpay's HMAC signature is computed over the raw request body bytes. Parsing with `express.json()` first and re-stringifying doesn't reliably reproduce the original byte sequence, which breaks verification silently.

```
POST /api/webhooks/razorpay
  ├─ Verifies x-razorpay-signature against RAZORPAY_WEBHOOK_SECRET
  ├─ De-duplicates via x-razorpay-event-id (in-memory Set, max 5000 entries)
  └─ Routes events:

  subscription.activated / subscription.charged
    └─ onSubscriptionActiveOrRenewed()
         ├─ Finds user via notes.userId (or razorpaySubscriptionId fallback)
         ├─ Sets plan, subscriptionStatus: "active", currentPeriodEnd
         └─ Resets monthlyUsage.count (handles Razorpay billing ↔ reset window drift)

  subscription.pending / subscription.halted
    └─ onSubscriptionPastDue() → subscriptionStatus: "past_due"

  subscription.cancelled / subscription.completed / subscription.expired
    └─ onSubscriptionEnded() → plan: "free", subscriptionStatus: "cancelled"
```

Always returns `200` on successful processing (Razorpay retries non-2xx for up to 24 hours). Returns `500` on genuine processing failure so Razorpay will retry.

---

### Frontend Billing Components

**`Pricing.jsx`** (`/pricing`)
- Displays plan cards using a local `PLAN_DISPLAY` array for layout.
- Uses `useSubscription` hook to know the current plan (highlights "current" state).
- On upgrade click: calls `POST /api/subscription/create`, gets `subscriptionId`, opens the native **Razorpay Checkout** modal using the `window.Razorpay` script (loaded in `index.html`).
- On checkout success: calls `POST /api/subscription/verify` for the fast-path activation, then calls `subscription.refresh()`.

**`BillingSettings.jsx`** (`/settings/billing`)
- Shows current plan name, subscription status, and `currentPeriodEnd` if cancelled.
- **Usage progress bar**: `(used / limit) × 100%`, hidden for Pro (unlimited).
- Self-service **Cancel** button: calls `POST /api/subscription/cancel` with confirmation dialog. Shows "access ends on [date]" messaging.
- "Upgrade Plan" / "Change Plan" link routes to `/pricing`.

**`useSubscription.js`** — Shared hook
- Calls `GET /api/subscription/me` on mount.
- Returns `{ subscription, loading, error, refresh }`.
- `refresh()` is called after checkout completion, post generation, and cancellation so usage counts update without a full page reload.

**`planGateError.js`** — 403 handler utility
- Imported in all creator wizards and `PublishModal`.
- Checks `err.response.data.code` for `USAGE_LIMIT_REACHED`, `FEATURE_NOT_AVAILABLE`, or `BRAND_LIMIT_REACHED`.
- Shows a toast with the server's message, then navigates to `/pricing` after 1.5s.
- Returns `true` if it handled the error (so caller skips its own generic toast), `false` otherwise.

---

## Shared Infrastructure

### Logo Processor

`server/utils/logoProcessor.js` — used by Quote and Offer generators.

```
processLogo(logoUrl, targetWidth) → { buffer, width, height }
  ├─ Downloads logo from Cloudinary
  ├─ removeLogoBackground(buffer)
  │     ├─ Samples top-left pixel as background reference
  │     ├─ Euclidean distance vs. reference for every pixel
  │     ├─ Pixels within threshold (35) → alpha: 0
  │     └─ Returns PNG buffer with transparency
  ├─ Resizes to targetWidth (aspect-ratio preserved)
  └─ Returns { buffer, width, height }
       height is used by offerController for vertical centering within Zone 1
```

### Unified Gallery

`PromoGallery.jsx` fetches all three post types in parallel and merges them:

```javascript
const [promoRes, quoteRes, offerRes] = await Promise.all([...]);
// Each post tagged with: type: 'festival' | 'quote' | 'offer'
// Sorted descending by createdAt
```

Filter tabs ("All Banners", "Festival Promos", "Quote Posts", "Offer Posts") with per-tab counts. Type badges: purple (Festival), blue (Quote), emerald (Offer). All actions (Favorite, Download, Delete, Instagram Publish) route dynamically to the correct API endpoint based on `post.type`.

---

## Instagram Publishing

AdWhiz uses the **Instagram API with Instagram Login** (Meta Graph API v25.0).

**Instagram publishing is a Basic/Pro feature.** Free users get a 403 `FEATURE_NOT_AVAILABLE` response when attempting to publish, which `planGateError.js` intercepts to show a toast and redirect to `/pricing`.

### OAuth Flow

```
GET /api/social/instagram/auth-url  →  Meta OAuth URL
User authorizes  →  GET /api/social/instagram/callback?code=...&state=userId
Server: code → short-lived token → long-lived token (60 days)
Server fetches /me  →  SocialAccount upserted in MongoDB
Redirect: /settings/social?connected=instagram
```

### Publishing Flow (all 3 post types)

```
POST /api/social/publish/instagram  { promoPostId, caption }
  requireFeature('instagramPublishing') checks plan first
  └─ Finds post across PromoPost → QuotePost → OfferPost (sequential fallback)
  └─ 3-step Meta flow: create container → poll status → publish
  └─ Saves igMediaId + publishedAt to model's socialPosts[]
```

### Automatic Token Refresh

`node-cron` job at 3:00 AM daily — refreshes 60-day tokens expiring within 10 days.

---

## API Reference

All protected routes require: `Authorization: Bearer <jwt_token>`

### User & Auth (`/api/user`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/user/signup` | Public | Register with email + password |
| POST | `/api/user/login` | Public | Login, receive JWT |
| POST | `/api/user/google` | Public | Google OAuth login / register |
| POST | `/api/user/forgot-password` | Public | Send password reset email |
| POST | `/api/user/reset-password` | Public | Set new password via reset token |

### Brand Profiles (`/api/logo`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/logo/add` | JWT | Upload logo + brand profile |
| GET | `/api/logo/list` | JWT | List all brand profiles |

### Festival Promo (`/api/promo`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/promo/templates` | JWT | List festival templates |
| POST | `/api/promo/ai-fill` | JWT | AI-generate copy + color palette |
| POST | `/api/promo/generate` | JWT + quota | Full 6-zone poster generation |
| GET | `/api/promo/list` | JWT | List user's festival posters |
| GET | `/api/promo/download/:id` | JWT | Download as attachment |
| PATCH | `/api/promo/favorite/:id` | JWT | Toggle favorite |
| POST | `/api/promo/upload-product-image` | JWT | Upload product image |

### Quote Post (`/api/quote`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/quote/generate` | JWT + quota | Generate quote post |
| GET | `/api/quote/list` | JWT | List user's quote posts |
| DELETE | `/api/quote/delete/:id` | JWT | Delete post + Cloudinary image |
| PATCH | `/api/quote/favorite/:id` | JWT | Toggle favorite |
| GET | `/api/quote/download/:id` | JWT | Download as attachment |

### Offer Post (`/api/offer`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/offer/generate` | JWT + quota | Generate offer post |
| GET | `/api/offer/list` | JWT | List user's offer posts |
| DELETE | `/api/offer/delete/:id` | JWT | Delete post + Cloudinary image |
| PATCH | `/api/offer/favorite/:id` | JWT | Toggle favorite |
| GET | `/api/offer/download/:id` | JWT | Download as attachment |

### Subscription & Billing (`/api/subscription`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/subscription/plans` | JWT | Plan catalogue (used by Pricing page) |
| GET | `/api/subscription/me` | JWT | Current plan, usage, feature flags |
| POST | `/api/subscription/create` | JWT | Create Razorpay subscription, get subscriptionId |
| POST | `/api/subscription/verify` | JWT | Verify payment signature, activate plan |
| POST | `/api/subscription/cancel` | JWT | Cancel subscription (end-of-cycle or immediate) |

### Social / Instagram (`/api/social`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/social/instagram/auth-url` | JWT | Get Meta OAuth URL |
| GET | `/api/social/instagram/callback` | Public | OAuth callback |
| GET | `/api/social/account` | JWT | Get connected Instagram account |
| DELETE | `/api/social/disconnect` | JWT | Disconnect Instagram |
| POST | `/api/social/publish/instagram` | JWT + Basic/Pro | Publish any post type |

### Webhooks (`/api/webhooks`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/webhooks/razorpay` | Signature | Razorpay subscription event handler |

> The webhook route uses `express.raw()` body parser, not `express.json()`. Do not add JWT middleware to this route.

---

## Local Setup Guide

### Prerequisites

- **Node.js** v18 or higher ([nodejs.org](https://nodejs.org))
- **npm** v9 or higher
- **MongoDB** — [Atlas free tier](https://www.mongodb.com/cloud/atlas) or local
- A modern browser

---

### Getting Your API Keys

#### 1. Recraft AI

1. Sign up at [recraft.ai](https://recraft.ai) → account settings → API → generate key.
2. Copy → `RECRAFT_API_KEY`.

#### 2. OpenAI

1. [platform.openai.com](https://platform.openai.com) → API Keys → Create new secret key.
2. Copy → `OPENAI_API_KEY`. Billing must be enabled.

#### 3. Cloudinary

1. [cloudinary.com](https://cloudinary.com) free account → Dashboard.
2. Copy **Cloud Name** → `CLOUDINARY_CLOUD_NAME`, **API Key** → `CLOUDINARY_API_KEY`, **API Secret** → `CLOUDINARY_API_SECRET`.

#### 4. MongoDB

**Atlas (recommended):**
1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → free M0 cluster.
2. Database Access: create user with read/write. Network Access: add your IP.
3. Connect → Drivers → copy connection string → replace `<password>` → `MONGO_URI`.

**Local:** `MONGO_URI=mongodb://localhost:27017/adwhiz`

> The app automatically sets Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) DNS before connecting, resolving Atlas hostname failures in some networks.

#### 5. Google OAuth (Optional)

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID → Web application.
2. Authorized JS origins + redirect URIs: `http://localhost:5173`.
3. Copy **Client ID** → `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client).

#### 6. Gmail (Password Reset)

1. Gmail account → 2-Step Verification → App Passwords → generate for "Mail".
2. `GMAIL_USER=your@gmail.com`, `GMAIL_PASS=16_char_app_password`.

#### 7. Instagram / Meta API

**Step 1 — Create Meta Developer App**
1. [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App.
2. Use case: **Other**. Type: **Business**. Name it (e.g. "AdWhiz Local").

**Step 2 — Add Instagram Product**
1. App Dashboard → Add Product → Instagram → Set up.
2. Left sidebar → **API setup with Instagram Login**.
3. Copy **Instagram App ID** → `INSTAGRAM_APP_ID`, **App Secret** → `INSTAGRAM_APP_SECRET`.

**Step 3 — Configure Redirect URI**
1. Instagram product settings → Valid OAuth Redirect URIs.
2. Add: `http://localhost:4000/api/social/instagram/callback` → Save.

**Step 4 — Add Test Account**
1. App Dashboard → Roles → Instagram Testers → add your Business/Creator account.
2. Accept invitation in Instagram notifications.

> Your account must be **Business** or **Creator** (not Personal): Instagram app → Settings → Account → Switch to Professional Account.

**Step 5 — Production (going live)**
App Review → Permissions → request `instagram_business_basic` + `instagram_business_content_publish` with screen recording of publishing flow.

---

### Setting Up Razorpay Subscriptions

#### Step 1 — Get API Keys

1. Sign up at [razorpay.com](https://razorpay.com) and complete KYC (or use Test Mode — no KYC needed for testing).
2. Dashboard → Settings → API Keys → **Generate Test Key**.
3. Copy **Key ID** → `RAZORPAY_KEY_ID`, **Key Secret** → `RAZORPAY_KEY_SECRET`.

#### Step 2 — Create Subscription Plans

Razorpay subscriptions require pre-created plans. Plans are immutable once created — if you need to change a price, create a new plan rather than editing the existing one.

1. Dashboard → **Subscriptions → Plans → Create Plan**.
2. Create the **Basic** plan:
   - Plan Name: `AdWhiz Basic`
   - Billing Frequency: `Monthly`, Interval: `1`
   - Price (INR): `199`
3. Create the **Pro** plan:
   - Plan Name: `AdWhiz Pro`
   - Billing Frequency: `Monthly`, Interval: `1`
   - Price (INR): `499`
4. Copy each plan's ID (format: `plan_GoQ1y3KxNz9WpL`) → `RAZORPAY_PLAN_ID_BASIC` and `RAZORPAY_PLAN_ID_PRO`.

> The Free plan has no Razorpay plan — it never touches the Razorpay API.

#### Step 3 — Configure Webhooks for Local Testing

Webhooks are required for subscription activation, renewal, and cancellation. For local development, tunnel your port using `ngrok` (or equivalent).

1. Start your backend: `cd server && npm run dev` (port 4000).
2. In a new terminal: `ngrok http 4000`.
3. Copy the ngrok forwarding URL (e.g. `https://a1b2-cd34.ngrok-free.app`).
4. Razorpay Dashboard → Settings → Webhooks → **Add New Webhook**:
   - **Webhook URL**: `https://a1b2-cd34.ngrok-free.app/api/webhooks/razorpay`
   - **Secret**: any alphanumeric string you choose → also set as `RAZORPAY_WEBHOOK_SECRET` in `.env`
   - **Active Events**: select all of these:
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.pending`
     - `subscription.halted`
     - `subscription.cancelled`
     - `subscription.expired`
5. Save.

> The server will start fine without Razorpay keys configured (lazy-init Proxy). Only calls to subscription routes will fail until keys are added.

---

### Environment Configuration

**`server/.env`:**

```bash
cd server && cp .env.example .env
```

```properties
# Server
PORT=4000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/adwhiz

# Auth
JWT_SECRET=generate_with__node_-e_"console.log(require('crypto').randomBytes(64).toString('hex'))"
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI APIs
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

# Razorpay (Subscription Billing)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_chosen_webhook_secret
RAZORPAY_PLAN_ID_BASIC=plan_xxxxxxxxxxxx
RAZORPAY_PLAN_ID_PRO=plan_xxxxxxxxxxxx
```

**`client/.env`:**

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
cd server && npm install && npm run dev
```
Expected output:
```
Server running on port 4000
MongoDB Connected
[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — subscription routes will fail until configured
[TokenRefresher] Token refresh cron job scheduled
```

> The Razorpay warning is expected if keys aren't configured yet. All non-subscription routes work normally.

**Terminal 2 — Frontend:**
```bash
cd client && npm install && npm run dev
```
Open `http://localhost:5173`.

---

### Testing the Payment Flow

1. Log in and set up a brand profile.
2. Navigate to `/pricing` (Billing & Plan in sidebar).
3. Click **Upgrade** on Basic or Pro.
4. The Razorpay Checkout modal opens — use test payment options:
   - Netbanking or Card → click **Success**.
5. Checkout completes → frontend calls `/api/subscription/verify` → plan activates immediately (fast path).
6. Concurrently, Razorpay fires `subscription.activated` to your ngrok webhook URL → server sets plan as source of truth.
7. Usage bar in `/settings/billing` updates after any post generation.

**Running the unit test suite (no keys required):**
```bash
cd server && node utils/testSubscription.js
```
Expected: `All 7 unit tests passed successfully!`

---

## Data Models

### User
```
_id, name, email, password (bcrypt),

# Subscription / Billing
plan:                   "free" | "basic" | "pro"  (default: "free")
razorpayCustomerId:     String | null
razorpaySubscriptionId: String | null
subscriptionStatus:     "none" | "created" | "active" | "past_due" | "cancelled" | "expired"
currentPeriodEnd:       Date | null

# Usage metering
monthlyUsage: {
  count:   Number   (default: 0)
  resetAt: Date     (default: now + 1 month)
}

createdAt, updatedAt
```

### Logo (Brand Profile)
```
_id, user (ref), name, sector, address, website, email,
images: { url, publicId },   ← Cloudinary
createdAt
```

> `unique` constraint on `name` was removed — multiple profiles with the same business name are allowed.

### PromoPost (Festival)
```
_id, user (ref), logo (ref), template (ref),
occasion, size,
userOverrides: {
  heroContent:       { headline, subheading, bodyMessage, closingSlogan, rightBoxQuote },
  valuesRow:         [{ icon, label, sublabel }],       // 3 items
  featuresBar:       [{ icon, text }],                  // 4 items
  productCategories: [{ imageUrl, cloudinaryPublicId, name }],
  footerColumns:     [{ icon, lines[], highlight }]     // 4 items
},
generatedImageUrl,    ← Cloudinary (watermarked if Free plan at generation time)
favorite (bool),
socialPosts: [{ platform, externalPostId, caption, publishedAt }],
createdAt, updatedAt
```

### QuotePost
```
_id, user (ref), logo (ref),
theme, tone,
quoteText, attribution,
size, generatedImageUrl,    ← Cloudinary (folder: quote_posts/)
favorite (bool),
socialPosts: [...],
createdAt, updatedAt
```

### OfferPost
```
_id, user (ref), logo (ref),
offerHeadline, offerDetails, validity, cta,
accentColor (hex, default #FFD700),
size, generatedImageUrl,    ← Cloudinary (folder: offer_posts/)
favorite (bool),
socialPosts: [...],
createdAt, updatedAt
```

### SocialAccount
```
_id, user (ref), platform ('instagram'),
igUserId, igUsername, profilePicUrl,
accessToken (long-lived, 60-day),
tokenExpiresAt, lastRefreshedAt,
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

**3-tier subscription system (Razorpay)**
- Free (5 posts/month + watermark), Basic ₹199 (100 posts + Instagram), Pro ₹499 (unlimited + multiple brands).
- Lazy-init Proxy for key-independent server boot — server starts without Razorpay keys configured.
- Webhook handler with raw-body signature verification, event de-duplication, and all subscription lifecycle events routed.
- `verifyPayment` fast path for immediate UI feedback; webhook is the source of truth.
- Cancellation with "cancel at period end" semantics — users keep paid access until cycle ends.

**Plan enforcement at every layer**
- `checkUsageLimit` middleware: monthly counter, auto-reset, quota block — on all three `/generate` routes.
- `requireFeature('instagramPublishing')` middleware: blocks Free users at the route level before any publishing logic runs.
- `applyWatermark()`: diagonal SVG watermark composited as the final step on Free-plan outputs before Cloudinary upload. Never applied to Basic/Pro.
- `incrementUsage()`: only called after successful generation + upload, so failed AI calls never consume quota.

**3 AI-powered post types**
- Festival Promo: 6-zone SVG layout, GPT writes all zones, Recraft generates festive background.
- Quote Post: central card overlay with drop shadow, AI-suggested color palette, dimmed background.
- Offer Announcement: 3-zone layout with urgency ribbon auto-trigger, customizable accent color.

**Frontend billing UX**
- `Pricing.jsx`: plan cards → Razorpay Checkout modal → verify → instant plan unlock.
- `BillingSettings.jsx`: usage progress bar, plan status, self-service cancel with period-end messaging.
- `useSubscription` hook: shared billing state, `refresh()` called after generation or checkout.
- `planGateError.js`: intercepts 403 plan-gate errors, shows descriptive toast, redirects to `/pricing`.

**Unified gallery**
- All three post types fetched in parallel, merged, sorted by `createdAt` desc.
- Pill filter tabs with counts, type color badges, all actions dynamically routed per `post.type`.
