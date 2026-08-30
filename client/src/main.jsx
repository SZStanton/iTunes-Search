import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SignedOutOnly from './components/SignedOutOnly.jsx';
import WakeBanner from './components/WakeBanner.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { OverlayProvider } from './context/OverlayContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OverlayProvider>
          {/* Outside the routes, so any page wakes the api. */}
          <WakeBanner />
          {/* Page views and Core Web Vitals. Inside the router, or a route
              change is never counted. Both stay quiet off Vercel. */}
          <Analytics />
          <SpeedInsights />
          <Routes>
            <Route
              path="/login"
              element={
                <SignedOutOnly>
                  <Login />
                </SignedOutOnly>
              }
            />
            <Route
              path="/register"
              element={
                <SignedOutOnly>
                  <Register />
                </SignedOutOnly>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            />
            {/* Anything else goes home, which bounces to login. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OverlayProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
