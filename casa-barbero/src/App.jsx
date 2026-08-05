import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Nav         from './components/Nav'
import Hero        from './components/Hero'
import Marquee     from './components/Marquee'
import Stats       from './components/Stats'
import Services    from './components/Services'
import Team        from './components/Team'
import Testimonial from './components/Testimonial'
import Gallery     from './components/Gallery'
import Pricing     from './components/Pricing'
import Hours       from './components/Hours'
import Contact     from './components/Contact'
import Footer      from './components/Footer'
import ConciergeBanner from './components/ConciergeBanner'

// Booking flow and error pages load on demand to keep the landing bundle lean
const BookingPage     = lazy(() => import('./pages/BookingPage'))
const AppointmentPage = lazy(() => import('./pages/AppointmentPage'))
const NotFound        = lazy(() => import('./pages/errors/NotFound'))

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="page-loader-glyph">B</span>
    </div>
  )
}

function HomePage() {
  return (
    <div className="wrapper">
      <Nav />
      <main>
        <Hero />
        <ConciergeBanner />
        <Marquee />
        <Stats />
        <Services />
        <Team />
        <Testimonial />
        <Gallery />
        <Pricing />
        <Hours />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/booking"     element={<BookingPage />} />
          <Route path="/appointment" element={<AppointmentPage />} />
          <Route path="*"            element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
