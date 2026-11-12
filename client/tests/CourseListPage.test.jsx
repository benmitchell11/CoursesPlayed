import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import CourseListPage from '../src/pages/CourseListPage'

const sampleCourses = [
  { id: 1, name: 'Titirangi Golf Club', city: 'Auckland', country: 'New Zealand' },
  { id: 2, name: 'Wanaka Golf Club', city: 'Wanaka', country: 'New Zealand' },
  { id: 3, name: 'Ōtaki Golf Club', city: 'New Zealand', country: 'New Zealand' }
]

describe('CourseListPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => sampleCourses
    })
  })

  test('lists courses and filters them by name or town', async () => {
    render(
      <MemoryRouter>
        <CourseListPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('link', { name: /Titirangi Golf Club/ })).toHaveAttribute('href', '/courses/1')
    expect(screen.getByRole('link', { name: /Wanaka Golf Club/ })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a course' }), {
      target: { value: 'Auckland' }
    })

    expect(screen.getByRole('link', { name: /Titirangi Golf Club/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Wanaka Golf Club/ })).not.toBeInTheDocument()
  })

  test('finds a macron name typed without the macron, and the reverse', async () => {
    render(
      <MemoryRouter>
        <CourseListPage />
      </MemoryRouter>
    )
    await screen.findByRole('link', { name: /Titirangi Golf Club/ })

    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a course' }), { target: { value: 'otaki' } })
    expect(screen.getByRole('link', { name: /Ōtaki Golf Club/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Titirangi Golf Club/ })).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a course' }), { target: { value: 'Wānaka' } })
    expect(screen.getByRole('link', { name: /Wanaka Golf Club/ })).toBeInTheDocument()
  })
})
