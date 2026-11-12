import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

const api = vi.hoisted(() => ({
  parseRound: vi.fn(),
  addPlayRound: vi.fn(),
  getMyPlayRounds: vi.fn(),
  searchCourses: vi.fn(),
  updateHandicap: vi.fn()
}))

vi.mock('../src/apiClient', () => api)

vi.mock('../src/context/UserContext', async () => {
  const React = await import('react')
  return {
    UserContext: React.createContext({ user: { username: 'ben', handicap: null }, setUser: () => {}, loading: false })
  }
})

import LogRound from '../src/pages/LogRound'

function proposal (overrides = {}) {
  return {
    round: {
      course_name: 'Titirangi',
      date_played: '2026-09-23',
      holes: 18,
      score: 92,
      rating: null,
      par: 72,
      course_rating: null,
      slope: null,
      notes: 'windy'
    },
    course: {
      best: { id: 1, name: 'Titirangi Golf Club', city: 'Auckland', score: 1 },
      confident: true,
      candidates: [{ id: 1, name: 'Titirangi Golf Club', city: 'Auckland', score: 1 }]
    },
    warnings: [],
    missing: [],
    ...overrides
  }
}

function renderPage () {
  return render(
    <MemoryRouter>
      <LogRound />
    </MemoryRouter>
  )
}

async function describeRound (text = 'played Titirangi yesterday, shot 92') {
  await userEvent.type(screen.getByLabelText('Your round'), text)
  await userEvent.click(screen.getByRole('button', { name: 'Read my round' }))
}

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset())
  api.getMyPlayRounds.mockResolvedValue([])
  api.addPlayRound.mockResolvedValue({ id: 'r1' })
})

describe('LogRound', () => {
  test('fills par in from the course list, follows the hole count, and stops once the golfer types their own', async () => {
    const PARS = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]
    const candidate = { id: 1, name: 'Titirangi Golf Club', city: 'Auckland', score: 1, par: 72, holes: '18', hole_pars: PARS, par_source: 'osm' }
    api.parseRound.mockResolvedValue(proposal({
      round: { ...proposal().round, par: null },
      course: { best: candidate, confident: true, candidates: [candidate] }
    }))
    renderPage()

    await describeRound()
    await screen.findByRole('form', { name: 'Check your round' })

    expect(screen.getByLabelText('Par')).toHaveValue(72)
    expect(screen.getByText(/Par 72 filled in from the course list/)).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Holes'), '9')
    expect(screen.getByLabelText('Par')).toHaveValue(36)

    await userEvent.clear(screen.getByLabelText('Par'))
    await userEvent.type(screen.getByLabelText('Par'), '70')
    await userEvent.selectOptions(screen.getByLabelText('Holes'), '18')
    expect(screen.getByLabelText('Par')).toHaveValue(70)
    expect(screen.queryByText(/filled in from the course list/)).not.toBeInTheDocument()
  })

  test('does not overwrite a par the golfer stated', async () => {
    const candidate = { id: 1, name: 'Titirangi Golf Club', city: 'Auckland', score: 1, par: 72, holes: '18', hole_pars: null, par_source: 'osm' }
    api.parseRound.mockResolvedValue(proposal({
      round: { ...proposal().round, par: 71 },
      course: { best: candidate, confident: true, candidates: [candidate] }
    }))
    renderPage()

    await describeRound('Titirangi par 71, shot 92')
    await screen.findByRole('form', { name: 'Check your round' })

    expect(screen.getByLabelText('Par')).toHaveValue(71)
    expect(screen.queryByText(/filled in from the course list/)).not.toBeInTheDocument()
  })

  test('shows the proposal and saves nothing until the golfer confirms', async () => {
    api.parseRound.mockResolvedValue(proposal())
    renderPage()

    await describeRound()

    expect(await screen.findByRole('form', { name: 'Check your round' })).toBeInTheDocument()
    expect(screen.getByLabelText('Course')).toHaveValue('1')
    expect(screen.getByLabelText('Score (total strokes)')).toHaveValue(92)
    expect(api.addPlayRound).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Save round' }))

    await waitFor(() => expect(api.addPlayRound).toHaveBeenCalledTimes(1))
    expect(api.addPlayRound).toHaveBeenCalledWith(expect.objectContaining({
      courseId: 1,
      datePlayed: '2026-09-23',
      score: 92,
      holes: 18,
      par: 72,
      notes: 'windy'
    }))
    expect(await screen.findByText(/Titirangi Golf Club is marked as played/)).toBeInTheDocument()
  })

  test('does not let an ambiguous course be saved until one is chosen', async () => {
    api.parseRound.mockResolvedValue(proposal({
      round: { ...proposal().round, course_name: 'Russley' },
      course: {
        best: null,
        confident: false,
        candidates: [
          { id: 5, name: 'Russley Golf Club', city: 'Christchurch', score: 1 },
          { id: 6, name: 'Russley Park Golf Course', city: 'Christchurch', score: 0.96 }
        ]
      },
      missing: ['course']
    }))
    renderPage()

    await describeRound('Russley 88')

    expect(await screen.findByText(/fits more than one course/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save round' })).toBeDisabled()

    await userEvent.selectOptions(screen.getByLabelText('Course'), '6')
    expect(screen.getByRole('button', { name: 'Save round' })).toBeEnabled()
  })

  test('tells the golfer when the course is not in the list and offers a search', async () => {
    api.parseRound.mockResolvedValue(proposal({
      round: { ...proposal().round, course_name: 'Augusta National' },
      course: { best: null, confident: false, candidates: [] },
      missing: ['course']
    }))
    api.searchCourses.mockResolvedValue([{ id: 9, name: 'Some Other Course', city: 'Napier' }])
    renderPage()

    await describeRound('Augusta National 80')

    expect(await screen.findByText(/is not in the course list/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Search for a course'), 'other')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('option', { name: /Some Other Course/ })).toBeInTheDocument()
  })

  test('shows validation warnings from the server', async () => {
    api.parseRound.mockResolvedValue(proposal({ warnings: ['The score looked wrong, so it has been left blank.'] }))
    renderPage()

    await describeRound()

    expect(await screen.findByText(/score looked wrong/)).toBeInTheDocument()
  })

  test('shows an error when the round cannot be read', async () => {
    api.parseRound.mockRejectedValue(new Error('Round parsing is unavailable right now. Try again shortly.'))
    renderPage()

    await describeRound()

    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable right now')
    expect(screen.queryByRole('form', { name: 'Check your round' })).not.toBeInTheDocument()
  })

  test('suggests a handicap from saved rounds and only applies it on request', async () => {
    const round = (id, day, score) => ({
      id, date_played: `2026-05-0${day}`, score, holes: 18, par: 72, course_rating: null, slope: null
    })
    api.getMyPlayRounds.mockResolvedValue([round('a', 1, 90), round('b', 2, 86), round('c', 3, 95)])
    api.updateHandicap.mockResolvedValue({ username: 'ben', handicap: 12 })
    renderPage()

    const apply = await screen.findByRole('button', { name: 'Use 12 as my handicap' })
    expect(api.updateHandicap).not.toHaveBeenCalled()

    await userEvent.click(apply)

    await waitFor(() => expect(api.updateHandicap).toHaveBeenCalledWith(12))
  })
})
