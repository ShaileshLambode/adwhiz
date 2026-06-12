# AdWhiz - Project Overview

AdWhiz is an AI-powered marketing automation platform designed to simplify the creation of professional branded social media posts and advertisements. By leveraging advanced generative AI and automated image processing, it allows businesses to generate high-quality visual content in seconds.

---

## 🏗️ System Architecture

AdWhiz follows a modern **Monorepo-style** architecture with a clear separation between the client and server.

- **Frontend (Client)**: A responsive React application built with Vite, utilizing Redux for state management and Framer Motion for premium animations.
- **Backend (Server)**: A Node.js/Express REST API that orchestrates AI generation, handles image processing, and manages persistence via MongoDB.

---

## 🛠️ Technology Stack

### Core Technologies
- **Frontend**: React 19, Vite, TailwindCSS v4, Redux Toolkit, Framer Motion.
- **Backend**: Node.js, Express, Mongoose (MongoDB).
- **Language**: JavaScript (ES6+).

### External Integrations
- **AI Generation**: [Recraft AI](https://recraft.ai/) (`recraftv3` model) for realistic marketing imagery.
- **Image Hosting**: [Cloudinary](https://cloudinary.com/) for asset storage and optimization.
- **Payments**: [Stripe](https://stripe.com/) for subscription and credit management.
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) for high-performance server-side image compositing.
- **Authentication & OAuth**: Google OAuth 2.0, JWT, and Meta/Instagram Professional Login.

---

## 🔄 Core Workflows

### 1. Brand Identity Setup
Users upload their business logo and provide basic business information (Name, Sector, Address, website, email). These assets are stored in Cloudinary and referenced in the database for all future post and flyer generations.

### 2. Multi-Zone Poster Generation Pipeline
The promo creator handles poster generation inside `promoController.js` through a structured vertical pipeline:
1.  **AI Copywriter Assistant (`aiFillContent`)**: GPT-4o-mini generates high-converting marketing copy and a festival-themed cohesive color palette (`festivalPalette`), returning structured JSON.
2.  **Backdrop Scene Call**: The server calls the Recraft V3 API (`recraftv3` model) to render a textless background scene matching the festival theme and using brand logo colors.
3.  **Vertical Zone Assembly**: The system dynamically splits the poster height into 6 zones and builds SVG buffers for each:
    - **Header Bar (Zone 1)**: Automatically positions the brand logo on the left and parses website/email contact coordinates on the right.
    - **Hero Panels (Zone 2)**: Renders typography on the left and maps the decorative, vertically-centered Quote Box card overlay on the right.
    - **Values Row (Zone 3)**: Aligns 3 columns of circular badges, uppercase labels, and sublabels.
    - **Features Bar (Zone 4)**: Composites 4-column badges with dynamic font sizes tailored to text length.
    - **Product Showcase (Zone 5)**: Integrates customizable product category names and crops uploaded images.
    - **Footer Strip (Zone 6)**: Renders a brand anchoring strip with optional highlighted call-to-actions.
4.  **Sharp Compositing & Upload**: Sharp composites these SVGs and logo files vertically. The final JPEG is uploaded to Cloudinary and saved to MongoDB.

### 3. User Wizard Workspace
Users customize every detail of the poster using a tabbed form wizard (`PromoCreator.jsx`) in the React client, including brand profiles, occasion prompts, values, marketing features, product categories, and footer columns.

### 4. Direct Instagram Publishing
Users connect their Instagram Business or Creator profile via the Meta OAuth flow. The backend exchanges the temporary OAuth code for a short-lived token and then a 60-day long-lived access token, fetching the user's profile details.
A background cron job runs daily at 3 AM to auto-refresh access tokens that are within 10 days of expiration.
When publishing, the server uploads the selected poster to an Instagram media container and publishes it directly to the user's live Instagram feed, archiving the post ID in the DB.

---

## 📊 Data Models

| Model | Description |
| :--- | :--- |
| **User** | Stores user credentials, profile information, and Google OAuth identifiers. |
| **Logo** | Links a user to their uploaded brand assets and business metadata. |
| **SocialAccount** | Stores Instagram scoped user ID, username, profile picture, long-lived access token, and expiration timestamp. |
| **ImageTemplate** | Holds default occasion blueprints (defaults for hero, values, features, products, footers). |
| **PromoPost** | Contains final poster links, user-applied layout overrides, favorited status, and a list of published `socialPosts`. |

---

## 🔌 API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/user/signup` | `POST` | User registration |
| `/api/user/login` | `POST` | Local login authentication |
| `/api/logo/add` | `POST` | Upload business logo and brand profiles to Cloudinary |
| `/api/logo/list` | `GET` | List user's business profiles |
| `/api/promo/templates` | `GET` | Retrieve list of active festival poster templates |
| `/api/promo/ai-fill` | `POST` | Query GPT-4o-mini to fill marketing copy and palettes |
| `/api/promo/generate` | `POST` | Trigger the Multi-Zone Recraft + Sharp layout generation |
| `/api/promo/list` | `GET` | Retrieve generated poster gallery history |
| `/api/promo/download/:id` | `GET` | Download a high-res marketing flyer attachment |
| `/api/promo/favorite/:id` | `PATCH` | Toggle favorite status of a poster |
| `/api/promo/upload-product-image` | `POST` | Upload customized category image to Cloudinary |
| `/api/social/instagram/auth-url` | `GET` | Retrieve Meta OAuth URL to connect Instagram Professional |
| `/api/social/instagram/callback` | `GET` | OAuth redirect callback exchanging code for token |
| `/api/social/account` | `GET` | Fetch connected Instagram account metadata |
| `/api/social/disconnect` | `DELETE` | Disconnect the connected Instagram account |
| `/api/social/publish/instagram` | `POST` | Publish a poster to the connected Instagram professional feed |

---

## ⚙️ Setup & Configuration

The project requires several environment variables to be configured in `.env` files located in the `server/` and `client/` directories. 

Refer to the following example files for the required keys:
- [Server .env.example](file:adwhiz/server/.env.example)
- [Client .env.example](file:adwhiz/client/.env.example)

> [!IMPORTANT]
> You can generate a secure **JWT_SECRET** using the following command in your terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 🚀 How to Run the Project

Follow these steps to get the development environment running locally.

### 1. Prerequisites
- Ensure you have **Node.js** (v18+) and **npm** installed.
- A **MongoDB** instance (local or Atlas) for data persistence.

### 2. Backend Setup
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create your environment file:
    ```bash
    cp .env.example .env
    ```
    *Open `.env` and fill in your API keys (Cloudinary, Recraft, etc.).*
4.  Start the server:
    ```bash
    npm run dev
    ```
    The server will start at `http://localhost:4000`.

### 3. Frontend Setup
1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create your environment file:
    ```bash
    cp .env.example .env
    ```
4.  Start the frontend:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.
