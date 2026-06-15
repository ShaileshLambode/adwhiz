# AdWhiz — AI-Powered Marketing Automation

AdWhiz is a full-stack web application that lets businesses generate professional, branded promotional posters in seconds using AI. Users provide their logo and brand details, choose a festive occasion, and AdWhiz automatically writes marketing copy, generates a thematic background image via Recraft AI, and composites a pixel-perfect multi-zone poster — which can then be published directly to Instagram.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [How Post Generation Works](#how-post-generation-works)
  - [The 6-Zone Poster Layout](#the-6-zone-poster-layout)
  - [Generation Pipeline](#generation-pipeline)
  - [Supported Poster Sizes](#supported-poster-sizes)
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

AdWhiz solves a real pain point for small businesses: creating consistent, professional-looking marketing visuals for festivals, sales, and seasonal occasions is time-consuming and often expensive. AdWhiz automates the entire pipeline:

1. **Brand Setup** — Upload your logo once. AdWhiz extracts your brand colors automatically.
2. **Occasion Selection** — Pick a festival or occasion (e.g., Diwali, New Year, Summer Sale).
3. **AI Content Fill** — GPT-4o-mini writes headlines, taglines, values, and feature text tailored to your brand and the occasion.
4. **Background Generation** — Recraft AI (`recraftv3` model) renders a high-quality, textless festive background scene.
5. **Poster Compositing** — The server assembles 6 SVG layout zones on top of the background using Sharp, producing a final JPEG.
6. **Publish or Download** — Share directly to your Instagram Business feed, or download the high-res image.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          REACT FRONTEND (Vite)                               │
│                                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ PromoCreator│  │GeneratedConent│  │SocialConnect│  │  Auth (Login /    │  │
│  │  (Wizard UI)│  │  (Gallery)   │  │(Instagram) │  │  Signup / OAuth)  │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  └────────────────────┘  │
│         │                │                 │                                  │
│         └────────────────┴─────────────────┘                                 │
│                          │  Axios + JWT                                       │
└──────────────────────────┼───────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────────────┐
│                      EXPRESS BACKEND (Node.js)                               │
│                                                                              │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │  UserRoutes  │  │  PromoRoutes   │  │  SocialRoutes  │  │  LogoRoutes │  │
│  │  (Auth/JWT)  │  │  (Generation)  │  │  (Instagram)   │  │  (Upload)   │  │
│  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  └──────┬──────┘  │
│         │                  │                    │                   │         │
│         └──────────────────┴────────────────────┴───────────────────┘         │
│                            │                                                  │
│  ┌─────────────────────────▼────────────────────────────────────────────┐    │
│  │                      Core Services                                    │    │
│  │  svgBuilder.js  │  posterLayout.js  │  promptBuilder.js  │  tokenRefresher│  │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────────┐
         │                 │                       │
┌────────▼────────┐ ┌──────▼──────┐  ┌────────────▼──────────┐
│   MongoDB Atlas  │ │ Cloudinary  │  │   External APIs       │
│  (Users, Posts,  │ │ (Logo &     │  │  ┌─────────────────┐  │
│  Logos, Social  │ │  Image CDN) │  │  │  Recraft AI v3  │  │
│  Accounts)      │ └─────────────┘  │  │  (Backgrounds)  │  │
└─────────────────┘                  │  ├─────────────────┤  │
                                     │  │  OpenAI GPT-4o  │  │
                                     │  │  mini (Copy)    │  │
                                     │  ├─────────────────┤  │
                                     │  │  Meta Graph API │  │
                                     │  │  (Instagram)    │  │
                                     │  └─────────────────┘  │
                                     └───────────────────────┘
```

**Frontend** is a React 19 SPA (Vite + Tailwind CSS v4 + Redux Toolkit) that communicates with the backend via Axios using JWT bearer tokens.

**Backend** is a Node.js/Express REST API that orchestrates AI calls, image compositing, database operations, and Instagram publishing. A `node-cron` job runs nightly at 3 AM to refresh expiring Instagram tokens automatically.

**Storage** — Cloudinary hosts all logos and generated poster images (publicly accessible CDN URLs are required for Instagram publishing). MongoDB stores application state.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend Framework | React 19, Vite 6 |
| Styling | Tailwind CSS v4 |
| State Management | Redux Toolkit + Redux Thunk |
| Animations | Framer Motion |
| HTTP Client | Axios |
| Auth (Frontend) | JWT decode, `@react-oauth/google` |
| Backend Runtime | Node.js (v18+) |
| Backend Framework | Express 4 |
| Database ORM | Mongoose 8 (MongoDB) |
| Image Processing | Sharp 0.34 |
| File Upload | Multer |
| Auth (Backend) | jsonwebtoken, bcryptjs, google-auth-library |
| Email | Nodemailer (Gmail) |
| Scheduling | node-cron |
| AI — Image Gen | Recraft AI (`recraftv3`) |
| AI — Copywriting | OpenAI GPT-4o-mini |
| Image Hosting | Cloudinary |
| Social Publishing | Meta Graph API v25.0 |

---

## Repository Structure

```
adwhiz/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Menu.jsx             # Sidebar navigation menu
│   │   │   ├── NavBar.jsx           # Top navigation bar
│   │   │   ├── PostReady.jsx        # Post preview & download
│   │   │   ├── PublishModal.jsx     # Instagram publish dialog
│   │   │   ├── SideBar.jsx          # App sidebar wrapper
│   │   │   ├── collectInformation.jsx  # Brand setup form
│   │   │   ├── forgotPassword.jsx   # Password reset flow
│   │   │   └── setNewPassword.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing / dashboard page
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Signup.jsx           # Registration page
│   │   │   ├── PromoCreator.jsx     # 🔑 Main wizard (poster customization)
│   │   │   ├── PromoGallery.jsx     # Generated posters gallery
│   │   │   ├── GeneratedContent.jsx # Detailed post view
│   │   │   ├── FavoriteList.jsx     # Favourited posters
│   │   │   └── SocialConnect.jsx    # Instagram account management
│   │   ├── Context/
│   │   │   └── StoreContext.jsx     # Redux store context
│   │   ├── hooks/
│   │   │   └── useScreenSize.js     # Responsive breakpoint hook
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx   # Auth-guarded route wrapper
│   │   └── App.jsx                  # Root component & router
│   ├── .env.example
│   └── vite.config.js
│
├── server/                          # Node.js / Express Backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── promoController.js       # 🔑 Core generation pipeline
│   │   ├── postController.js        # Post CRUD operations
│   │   ├── LogoController.js        # Logo upload & brand profiles
│   │   ├── UserController.js        # Auth, registration, OAuth
│   │   └── socialController.js      # Instagram OAuth & publishing
│   ├── middleware/
│   │   ├── UserMiddleware.js        # JWT verification middleware
│   │   └── uploadMiddleware.js      # Multer file upload config
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Logo.js                  # Brand profile schema
│   │   ├── PromoPost.js             # Generated poster schema
│   │   ├── SocialAccount.js         # Connected Instagram account
│   │   ├── ImageTemplate.js         # Festival template defaults
│   │   └── post.js                  # Basic post schema
│   ├── routes/
│   │   ├── UserRoutes.js
│   │   ├── LogoRoutes.js
│   │   ├── promoRoutes.js
│   │   ├── postRoutes.js
│   │   └── socialRoutes.js
│   ├── seed/
│   │   └── templates.js             # Festival template seed data
│   ├── utils/
│   │   ├── svgBuilder.js            # 🔑 SVG zone construction (all 6 zones)
│   │   ├── posterLayout.js          # Zone height calculations
│   │   ├── promptBuilder.js         # Recraft image prompt construction
│   │   ├── festivalPalettes.js      # Fallback color palettes by festival
│   │   ├── tokenRefresher.js        # Nightly Instagram token cron job
│   │   ├── cloudinary.js            # Cloudinary SDK config
│   │   └── openai.js                # OpenAI SDK config
│   ├── .env.example
│   └── server.js                    # Express app entry point
│
└── README.md
```

---

## How Post Generation Works

### The 6-Zone Poster Layout

Every AdWhiz poster is divided into 6 vertical zones. Heights are calculated dynamically as percentages of the total poster height (landscape vs. portrait ratios are handled separately):

```
┌─────────────────────────────────────────┐
│  ZONE 1 — Header Bar            (10%)   │  Logo | Tagline | Contact Info
├────────────────────────┬────────────────┤
│                        │                │
│  ZONE 2 LEFT           │  ZONE 2 RIGHT  │  (42–46% combined)
│  Festival Text &       │  Quote Box     │
│  Headline              │  Card          │
│                        │                │
├────────────────────────┴────────────────┤
│  ZONE 3 — Values Row            (10%)   │  3 circular badge columns
├─────────────────────────────────────────┤
│  ZONE 4 — Features Bar           (8%)   │  4 marketing feature badges
├─────────────────────────────────────────┤
│  ZONE 5 — Product Categories    (8–10%) │  Product images + names
├─────────────────────────────────────────┤
│  ZONE 6 — Footer Strip       (remaining)│  4 info columns + CTA
└─────────────────────────────────────────┘
```

**Zone details:**

| Zone | Content | Key Logic |
| :--- | :--- | :--- |
| Zone 1 (Header) | Brand logo (left), center tagline, website/email (right) | Logo is auto-scaled and composited via Sharp |
| Zone 2 Left | Festival name, headline, subheading, body message, closing slogan | Auto-fit text wrapping with dynamic font sizing |
| Zone 2 Right | Decorative quote box card | Vertically centered; character-limited quote |
| Zone 3 (Values) | 3 circular icon badges with label + sublabel | Uppercase labels; even column spacing |
| Zone 4 (Features) | 4 marketing feature badges with icons | Dynamic font scaling from 9px–11px based on text length |
| Zone 5 (Products) | Product category images + names | Images cropped to uniform dimensions |
| Zone 6 (Footer) | 4 configurable columns; optional highlight CTA | Contrast-adaptive — luminance checked for readability |

### Generation Pipeline

When a user clicks **Generate** in `PromoCreator.jsx`, the following sequence runs entirely on the server (`promoController.js`):

```
User submits form (occasion, brand profile, overrides)
        │
        ▼
1. LOGO FETCH & PROCESSING
   └─ Download logo from Cloudinary
   └─ removeLogoBackground() — pixel-level bg removal via Sharp
   └─ extractLogoColors() — extract 5 dominant brand colors from logo pixels

        │
        ▼
2. AI COPYWRITING  [POST /api/promo/ai-fill]
   └─ GPT-4o-mini generates:
      • Headline, subheading, body message, closing slogan
      • Quote box text
      • 3 brand values (icon, label, sublabel)
      • 4 marketing features (icon, text)
      • Festival color palette (festivalPalette)

        │
        ▼
3. BACKGROUND GENERATION  [Recraft AI]
   └─ buildPrompt() constructs a detailed text prompt using:
      • Occasion name
      • Brand sector
      • Extracted logo colors
      • festivalPalette from AI step
   └─ Recraft V3 renders a 1024×1024 (or sized) background JPEG
   └─ Image downloaded as buffer

        │
        ▼
4. SVG ZONE ASSEMBLY  [svgBuilder.js]
   └─ calculateZoneHeights(H, W) — proportional heights for 6 zones
   └─ Each zone built as an SVG buffer:
      • buildZone1Header()
      • buildZone2Left()
      • buildZone2Right_QuoteBox()
      • buildZone3ValuesRow()
      • buildZone4FeaturesBar()
      • buildZone5ProductLabels()
      • buildZone6FooterStrip()
   └─ All SVG text is XML-escaped (esc() utility) and capitalized

        │
        ▼
5. SHARP COMPOSITING
   └─ Background image resized to target dimensions
   └─ Each SVG zone composited vertically onto the background
   └─ Logo PNG composited into Zone 1 header area
   └─ Product images composited into Zone 5

        │
        ▼
6. UPLOAD & SAVE
   └─ Final JPEG uploaded to Cloudinary
   └─ PromoPost document saved to MongoDB
      (generatedImageUrl, userOverrides, occasion, size, logo ref)

        │
        ▼
   Response: { success: true, imageUrl, postId }
```

### Supported Poster Sizes

| Name | Dimensions | Use Case |
| :--- | :--- | :--- |
| Square | 1024 × 1024 | Instagram feed (default) |
| Portrait | 1024 × 1365 | Instagram portrait feed |
| Landscape | 1365 × 1024 | Website banners, Facebook |
| Story | 1024 × 1820 | Instagram / WhatsApp Stories |

Zone heights auto-adjust per aspect ratio. Landscape mode allocates more height to Zone 2 (hero) to compensate for reduced vertical space.

---

## Instagram Publishing

AdWhiz integrates with the **Instagram API with Instagram Login** (Meta Graph API v25.0), which supports Instagram Business and Creator accounts directly — no Facebook Page link required.

### OAuth Flow

```
User clicks "Connect Instagram"
        │
        ▼
GET /api/social/instagram/auth-url
        │  Returns Meta OAuth URL with:
        │  • client_id (INSTAGRAM_APP_ID)
        │  • redirect_uri
        │  • scope: instagram_business_basic, instagram_business_content_publish
        │  • state: userId (to identify user on callback)
        │
        ▼
User authorizes on Meta's consent screen
        │
        ▼
Meta redirects → GET /api/social/instagram/callback?code=...&state=userId
        │
        ▼
Server exchanges code → short-lived token (via api.instagram.com)
        │
        ▼
Server exchanges short-lived → long-lived token (60 days)
        │
        ▼
Server fetches /me (id, username, profile_picture_url)
        │
        ▼
SocialAccount upserted in MongoDB (igUserId, igUsername, accessToken, tokenExpiresAt)
        │
        ▼
Redirect → frontend /settings/social?connected=instagram
```

### Publishing Flow

```
User selects a poster → clicks Publish to Instagram
        │
        ▼
POST /api/social/publish/instagram  { promoPostId, caption }
        │
        ▼
1. Fetch PromoPost from DB → get Cloudinary image URL
2. Fetch SocialAccount → get accessToken, igUserId
3. Token expiry check
4. POST graph.instagram.com/{igUserId}/media
   { image_url: cloudinaryUrl, caption, access_token }
   → Returns containerId
5. Poll container status (up to 5 retries, 1s apart) until FINISHED
6. POST graph.instagram.com/{igUserId}/media_publish
   { creation_id: containerId, access_token }
   → Returns igMediaId
7. Save igMediaId + publishedAt to PromoPost.socialPosts[]
        │
        ▼
Response: { success: true, igMediaId, message: "Posted to @username" }
```

### Automatic Token Refresh

A `node-cron` job runs **every day at 3:00 AM** and finds all `SocialAccount` records whose token expires within 10 days and hasn't been refreshed in the last 24 hours. For each, it calls `graph.instagram.com/refresh_access_token` to get a new 60-day token and updates the record in MongoDB.

---

## API Reference

All protected routes require the header: `Authorization: Bearer <jwt_token>`

### User & Auth

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/user/signup` | POST | Public | Register a new user (email + password) |
| `/api/user/login` | POST | Public | Login and receive JWT |
| `/api/user/google` | POST | Public | Google OAuth login / registration |
| `/api/user/forgot-password` | POST | Public | Send password reset email |
| `/api/user/reset-password` | POST | Public | Set new password via reset token |

### Brand Profiles (Logo)

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/logo/add` | POST | JWT | Upload logo + brand profile to Cloudinary |
| `/api/logo/list` | GET | JWT | List all brand profiles for the current user |

### Promo Generation

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/promo/templates` | GET | JWT | List available festival templates |
| `/api/promo/ai-fill` | POST | JWT | AI-generate copy & color palette for an occasion |
| `/api/promo/generate` | POST | JWT | Run full poster generation pipeline |
| `/api/promo/list` | GET | JWT | Retrieve the user's generated poster gallery |
| `/api/promo/download/:id` | GET | JWT | Download high-res poster as attachment |
| `/api/promo/favorite/:id` | PATCH | JWT | Toggle favorite status |
| `/api/promo/upload-product-image` | POST | JWT | Upload a product image to Cloudinary |

### Social (Instagram)

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/social/instagram/auth-url` | GET | JWT | Get the Meta OAuth authorization URL |
| `/api/social/instagram/callback` | GET | Public | OAuth callback — exchanges code for tokens |
| `/api/social/account` | GET | JWT | Get connected Instagram account info |
| `/api/social/disconnect` | DELETE | JWT | Disconnect Instagram account |
| `/api/social/publish/instagram` | POST | JWT | Publish poster to Instagram feed |

---

## Local Setup Guide

### Prerequisites

- **Node.js** v18 or higher — [download](https://nodejs.org/)
- **npm** v9 or higher (comes with Node.js)
- **MongoDB** — either [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier) or a local MongoDB instance
- A modern browser (Chrome, Firefox, Edge)

---

### Getting Your API Keys

#### 1. Recraft AI (Background Image Generation)

Recraft powers the festive background scenes.

1. Go to [recraft.ai](https://recraft.ai) and sign up for an account.
2. Navigate to your account settings or API section.
3. Generate an API key.
4. Copy the key — this is your `RECRAFT_API_KEY`.

> The app uses the `recraftv3` model.

---

#### 2. OpenAI (Marketing Copy Generation)

GPT-4o-mini is used to auto-write headlines, taglines, and feature text.

1. Go to [platform.openai.com](https://platform.openai.com) and create an account.
2. Navigate to **API Keys** in the left sidebar.
3. Click **Create new secret key** and copy it.
4. This is your `OPENAI_API_KEY`.

> Make sure your OpenAI account has billing set up. GPT-4o-mini usage costs are very low.

---

#### 3. Cloudinary (Logo & Image Storage)

All logos and generated poster images are stored on Cloudinary.

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account.
2. From your **Dashboard**, copy three values:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

---

#### 4. MongoDB

**Option A — MongoDB Atlas (recommended for ease of setup):**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a free **M0 cluster**.
3. Under **Database Access**, create a user with read/write permissions.
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for open access during development).
5. Click **Connect → Drivers** and copy the connection string.
6. Replace `<password>` in the string with your DB user password.
7. This is your `MONGO_URI`.

**Option B — Local MongoDB:**
1. Install MongoDB Community from [mongodb.com/try/download](https://www.mongodb.com/try/download/community).
2. Start the service: `mongod --dbpath /data/db`
3. Use `MONGO_URI=mongodb://localhost:27017/adwhiz`

---

#### 5. Google OAuth (Optional — for Google Login)

This enables the "Sign in with Google" button.

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a project (or select an existing one).
3. Navigate to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth 2.0 Client ID**.
5. Select **Web application**.
6. Under **Authorized JavaScript origins**, add `http://localhost:5173`.
7. Under **Authorized redirect URIs**, add `http://localhost:5173`.
8. Click **Create** and copy the **Client ID**.
9. `GOOGLE_CLIENT_ID` (server) = `VITE_GOOGLE_CLIENT_ID` (client) — same value.

---

#### 6. Gmail (Password Reset Emails)

Used by Nodemailer to send password reset links.

1. Use any Gmail account.
2. Enable **2-Step Verification** on the account.
3. Go to **Google Account → Security → App Passwords**.
4. Generate an App Password for "Mail" and copy it.
5. Set `GMAIL_USER=your@gmail.com` and `GMAIL_PASS=the_16_char_app_password`.

---

#### 7. Instagram / Meta API (Direct Publishing)

This is the most involved setup. AdWhiz uses the **Instagram API with Instagram Login**, which requires a Meta Developer App.

**Step 1 — Create a Meta Developer App**

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in with your Facebook account.
2. Click **My Apps → Create App**.
3. When asked about use case, select **Other → Next**.
4. Select **Business** as the app type → **Next**.
5. Give your app a name (e.g., "AdWhiz Local") and enter your email.
6. Click **Create App**.

**Step 2 — Add Instagram Product**

1. From your App Dashboard, click **Add Product**.
2. Find **Instagram** and click **Set up**.
3. You'll be redirected to the Instagram setup page.
4. From the left sidebar, click **API setup with Instagram Login**.
5. Your **Instagram App ID** and **Instagram App Secret** are shown here.
   - Copy them → these are `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`.

**Step 3 — Configure OAuth Redirect URI**

1. Still in the Instagram product settings, find the **Valid OAuth Redirect URIs** field.
2. Add: `http://localhost:4000/api/social/instagram/callback`
3. Click **Save Changes**.

**Step 4 — Add a Test Account**

In development mode, you can only authenticate accounts that have been explicitly added to your app as testers or developers.

1. In your App Dashboard, go to **Roles → Test Users** or **Instagram Testers**.
2. Add your Instagram Business or Creator account as a tester.
3. Log into that Instagram account and accept the tester invitation at [instagram.com/oauth/authorize](https://www.instagram.com/).

> **Important:** Your Instagram account must be a **Business** or **Creator** account (not a personal account). You can switch in the Instagram app under Settings → Account → Switch to Professional Account.

**Step 5 — For Production (going live)**

When you're ready to use the app with accounts other than your own test accounts:
1. Go to **App Review → Permissions and Features**.
2. Request approval for `instagram_business_basic` and `instagram_business_content_publish`.
3. Submit your app for Meta's review (you'll need to provide a screen recording of your app's publishing flow).

---

### Environment Configuration

**Server — create `server/.env`:**

```bash
cd server
cp .env.example .env
```

Fill in `server/.env`:

```properties
# Server
PORT=4000
MONGO_URI=mongodb://localhost:27017/adwhiz

# Authentication
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_long_random_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI APIs
RECRAFT_API_KEY=your_recraft_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Email (Password Reset)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_gmail_app_password

# Instagram Publishing
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:4000/api/social/instagram/callback
CLIENT_URL=http://localhost:5173
```

**Client — create `client/.env`:**

```bash
cd client
cp .env.example .env
```

Fill in `client/.env`:

```properties
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

---

### Running the App

**Terminal 1 — Start the backend:**

```bash
cd server
npm install
npm run dev
```

The API will be available at `http://localhost:4000`. You should see:
```
Server running on port 4000
MongoDB connected
[TokenRefresher] Token refresh cron job scheduled
```

**Terminal 2 — Start the frontend:**

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

**First-time setup:**

1. Open `http://localhost:5173` and create an account.
2. Go to **Brand Profile** and upload your business logo with your business details.
3. Navigate to **Create Poster**, choose a festival/occasion, customize the zones, and click **Generate**.
4. Once generated, you can **Download** the poster or connect your Instagram account and **Publish** directly.

---

## Data Models

### User

Stores authentication credentials and profile info.

```
_id, name, email, password (bcrypt hashed), googleId, createdAt
```

### Logo (Brand Profile)

Links a user to their business identity and uploaded logo.

```
_id, user (ref), businessName, sector, address, website, email,
logoUrl (Cloudinary URL), cloudinaryPublicId, createdAt
```

### PromoPost

The generated poster record, including all content overrides and social publishing history.

```
_id, user (ref), logo (ref), template (ref), occasion, size,
userOverrides: {
  heroContent: { headline, subheading, bodyMessage, closingSlogan, rightBoxQuote },
  valuesRow:   [{ icon, label, sublabel }],
  featuresBar: [{ icon, text }],
  productCategories: [{ imageUrl, cloudinaryPublicId, name }],
  footerColumns: [{ icon, lines[], highlight }]
},
generatedImageUrl (Cloudinary URL), favorite (bool),
socialPosts: [{ platform, externalPostId, caption, publishedAt }],
createdAt, updatedAt
```

### SocialAccount

Stores the user's connected Instagram account and OAuth tokens.

```
_id, user (ref), platform ('instagram'), igUserId, igUsername,
profilePicUrl, accessToken (long-lived, 60-day),
tokenExpiresAt, lastRefreshedAt, createdAt
```

### ImageTemplate

Default content blueprints for each festival/occasion (seed data in `server/seed/templates.js`).

```
_id, name, occasion, heroContent, valuesRow[], featuresBar[],
productCategories[], footerColumns[], isActive
```

---

## Key Features

**AI-Powered Generation**
- GPT-4o-mini writes all marketing copy tailored to your brand sector and the chosen occasion.
- Recraft AI generates high-quality, textless background scenes themed to the festival.
- Logo colors are automatically extracted and fed into the Recraft prompt for brand consistency.

**6-Zone Poster Compositor**
- Fully server-side SVG assembly using Sharp for pixel-perfect output.
- Dynamic text wrapping and auto-fit font sizing — text never overflows.
- Contrast-adaptive text colors based on background luminance.
- XML-safe character escaping with capitalization-before-escape to prevent entity corruption.

**Direct Instagram Publishing**
- OAuth 2.0 integration with Meta Graph API v25.0 (Instagram Login flow).
- Automatic token refresh via nightly cron job (refreshes 60-day tokens before they expire).
- 3-step Meta publishing flow: create container → poll status → publish.

**User Workspace**
- Poster gallery with favorite toggle and download.
- Regeneration: tweak any zone and regenerate without losing brand context.
- Full wizard UI for customizing every zone's content before and after generation.
