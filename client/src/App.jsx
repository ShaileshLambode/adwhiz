import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/Signup'
import CollectInformation from './components/collectInformation'
import ForgotPassword from './components/forgotPassword'
import CheckYourEmail from './components/checkYourEmail'
import SetNewPassword from './components/setNewPassword'
import PasswordReset from './components/passwordReset'
import Home from './pages/Home'
import SideBar from './components/SideBar'
import NavBar from './components/NavBar'
import GeneratedContent from './pages/GeneratedContent'
import PostReady from './components/PostReady'
import ProtectedRoute from './routes/ProtectedRoute';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import FavoriteList from './pages/FavoriteList'
import PromoCreator from './pages/PromoCreator'
import PromoGallery from './pages/PromoGallery'
import SocialConnect from './pages/SocialConnect'
import PostTypeLauncher from './pages/PostTypeLauncher'
import QuoteCreator from './pages/QuoteCreator'
import OfferCreator from './pages/OfferCreator'
import Pricing from './pages/Pricing'
import BillingSettings from './pages/BillingSettings'


const LayoutRoutes = ['/home', '/generatedcontent', '/postready', '/favoritelist', '/promo-creator', '/promo-creator/festival', '/promo-creator/quote', '/promo-creator/offer', '/promo-gallery', '/settings/social', '/pricing', '/settings/billing']

function AppLayout() {
  const location = useLocation()
  const showLayout = LayoutRoutes.includes(location.pathname.toLowerCase())

  return (
    <div className='flex'>
      <GoogleOAuthProvider>
        {showLayout && <SideBar />}
        <div className='flex-1'>
          {showLayout && <NavBar />}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/collectInformation" element={<CollectInformation />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/checkYourEmail" element={<CheckYourEmail />} />
            <Route path="/setNewPassword/:id/:token" element={<SetNewPassword />} />
            <Route path="/passwordReset" element={<PasswordReset />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/generatedcontent" element={<ProtectedRoute><GeneratedContent /></ProtectedRoute>} />
            <Route path="/postReady" element={<ProtectedRoute><PostReady /></ProtectedRoute>} />
            <Route path="/favoritelist" element={<ProtectedRoute><FavoriteList /></ProtectedRoute>} />
            <Route path="/promo-creator" element={<ProtectedRoute><PostTypeLauncher /></ProtectedRoute>} />
            <Route path="/promo-creator/festival" element={<ProtectedRoute><PromoCreator /></ProtectedRoute>} />
            <Route path="/promo-creator/quote" element={<ProtectedRoute><QuoteCreator /></ProtectedRoute>} />
            <Route path="/promo-creator/offer" element={<ProtectedRoute><OfferCreator /></ProtectedRoute>} />
            <Route path="/promo-gallery" element={<ProtectedRoute><PromoGallery /></ProtectedRoute>} />
            <Route path="/settings/social" element={<ProtectedRoute><SocialConnect /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/settings/billing" element={<ProtectedRoute><BillingSettings /></ProtectedRoute>} />
          </Routes>
        </div>
        <ToastContainer />
      </GoogleOAuthProvider>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
