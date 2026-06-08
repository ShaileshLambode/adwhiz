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
- **Authentication**: Google OAuth 2.0 & JWT.

---

## 🔄 Core Workflows

### 1. Brand Identity Setup
Users upload their business logo and provide basic business information (Name, Sector, Address). These assets are stored in Cloudinary and referenced in the database for all future post generations.

### 2. AI-Powered Generation
The generation process is handled in `postController.js`:
1.  **Prompt Engineering**: The system constructs a detailed prompt using the business name, sector, description, and selected tone.
2.  **AI Call**: A request is sent to Recraft AI to generate a realistic background scene.
3.  **Logo Compositing**: Once the AI image is generated, the **Sharp** library is used to overlay the business logo onto the generated image at a specific position.
4.  **Persistence**: The final branded image is uploaded to Cloudinary, and the post data is saved to MongoDB.

### 3. User Workspace
Users can manage their generated content through:
- **Favorites**: Toggle specific posts as favorites for quick access.
- **Downloads**: High-quality downloads of the branded images.
- **Regeneration**: Quickly recreate posts with updated parameters while keeping the same brand context.

---

## 📊 Data Models

| Model | Description |
| :--- | :--- |
| **User** | Stores user credentials, profile information, and Google OAuth identifiers. |
| **Logo** | Links a user to their uploaded brand assets and business metadata. |
| **Post** | Contains references to the generated image, the parameters used (tone, sector), and favorite status. |

---

## 🔌 API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/user/` | `POST` | User registration, login, and Google OAuth handling. |
| `/api/logo/` | `POST` / `GET` | Uploading and retrieving business brand assets. |
| `/api/post/` | `POST` | Trigger the AI generation and compositing workflow. |
| `/api/post/view` | `GET` | Retrieve a list of generated posts for the authenticated user. |
| `/api/post/favorite/:id` | `PATCH` | Toggle the favorite status of a specific post. |

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
