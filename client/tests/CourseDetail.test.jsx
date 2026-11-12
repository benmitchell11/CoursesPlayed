import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../src/apiClient', () => ({
  getCourse: vi.fn(async () => ({
    id: 1,
    name: 'Titirangi',
    city: 'Auckland',
    country: 'New Zealand',
    lat: -36.9,
    lng: 174.6
  })),
  getCoursePlayedSummary: vi.fn(async () => ({
    count: 1,
    friends: []
  })),
  hasMarkedCourse: vi.fn(async () => false),
  markCoursePlayed: vi.fn(),
  unmarkCoursePlayed: vi.fn(),
  addPlayRound: vi.fn()
}))

vi.mock('../src/context/UserContext', async () => {
  const React = await import('react')
  return {
    UserContext: React.createContext({ user: null, setUser: () => {}, loading: false })
  }
})

import CourseDetail from '../src/pages/CourseDetail'

describe('CourseDetail', () => {
  test('loads and displays course details and played summary', async () => {
    render(
      <MemoryRouter initialEntries={['/courses/1']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Titirangi')).toBeInTheDocument()
    expect(screen.getByText('Auckland, New Zealand')).toBeInTheDocument()
    expect(screen.getByText((_, element) => (
      element?.textContent === '1 player marked this course as played'
    ))).toBeInTheDocument()
    expect(screen.getByText((_, element) => (
      element?.textContent === 'Sign in to see which of your friends have played here.'
    ))).toBeInTheDocument()
  })
})
