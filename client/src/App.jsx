import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Register from './pages/Register'
import SignIn from './pages/SignIn'
import CoursesPage from './pages/CoursesPage'
import CourseListPage from './pages/CourseListPage'
import CourseDetail from './pages/CourseDetail'
import UserProfile from './pages/UserProfile'
import LogRound from './pages/LogRound'
import ChatWidget from './components/ChatWidget'
import GolfersPage from './pages/GolfersPage'
import GolferProfile from './pages/GolferProfile'
import Forum from './pages/Forum'
import ForumPost from './pages/ForumPost'

function App () {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/map" element={<CoursesPage />} />
        <Route path="/courses" element={<CourseListPage />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/log" element={<ProtectedRoute><LogRound /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/golfers" element={<ProtectedRoute><GolfersPage /></ProtectedRoute>} />
        <Route path="/golfers/:username" element={<ProtectedRoute><GolferProfile /></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
        <Route path="/forum/:id" element={<ProtectedRoute><ForumPost /></ProtectedRoute>} />
      </Routes>
      <ChatWidget />
    </>
  )
}

export default App
