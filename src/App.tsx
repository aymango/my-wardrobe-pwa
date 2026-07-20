import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppShell } from './components/AppShell'
import { LoadingScreen } from './components/LoadingScreen'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { WardrobePage } from './pages/WardrobePage'
import { ClothingFormPage } from './pages/ClothingFormPage'
import { ClothingDetailPage } from './pages/ClothingDetailPage'
import { OutfitsPage } from './pages/OutfitsPage'
import { OutfitBuilderPage } from './pages/OutfitBuilderPage'
import { OutfitDetailPage } from './pages/OutfitDetailPage'
import { IdeasPage } from './pages/IdeasPage'
import { IdeaFormPage } from './pages/IdeaFormPage'
import { IdeaDetailPage } from './pages/IdeaDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen label="Проверяю вход…" />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="wardrobe" element={<WardrobePage />} />
              <Route path="clothes/new" element={<ClothingFormPage />} />
              <Route path="clothes/:id" element={<ClothingDetailPage />} />
              <Route path="clothes/:id/edit" element={<ClothingFormPage />} />
              <Route path="outfits" element={<OutfitsPage />} />
              <Route path="outfits/builder" element={<OutfitBuilderPage />} />
              <Route path="outfits/:id" element={<OutfitDetailPage />} />
              <Route path="outfits/:id/edit" element={<OutfitBuilderPage />} />
              <Route path="ideas" element={<IdeasPage />} />
              <Route path="ideas/new" element={<IdeaFormPage />} />
              <Route path="ideas/:id" element={<IdeaDetailPage />} />
              <Route path="ideas/:id/edit" element={<IdeaFormPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
