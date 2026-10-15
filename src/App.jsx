import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import About from './pages/About'
import Article from './pages/Article'
import Book from './pages/Book'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Podcast from './pages/Podcast'
import Stories from './pages/Stories'

// Code-split: public visitors never download the studio.
const AdminStudio = lazy(() => import('./pages/AdminStudio'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="stories" element={<Stories />} />
          <Route path="stories/:slug" element={<Article />} />
          <Route path="podcast" element={<Podcast />} />
          <Route path="about" element={<About />} />
          <Route path="book" element={<Book />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* Hidden: outside <Layout />, not in the navbar or footer. */}
        <Route
          path="/nyanchiew-studio"
          element={
            <Suspense fallback={null}>
              <AdminStudio />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
