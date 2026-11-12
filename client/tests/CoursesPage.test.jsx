import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import CoursesPage from '../src/pages/CoursesPage'

const sampleCourses = [
  { id: 1, name: 'Titirangi', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 }
]

describe('CoursesPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => sampleCourses
    })
  })

  test('loads and displays course pins on mount', async () => {
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('button', { name: 'Titirangi' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/v1/courses', expect.anything()))
  })
})
