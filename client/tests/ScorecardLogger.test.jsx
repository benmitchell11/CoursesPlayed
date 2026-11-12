import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

const api = vi.hoisted(() => ({
  parseScorecard: vi.fn(),
  addPlayRound: vi.fn(),
  searchCourses: vi.fn()
}))

vi.mock('../src/apiClient', () => api)
vi.mock('../src/lib/image', () => ({
  photoToJpeg: vi.fn(async () => ({ image: 'AAAA', mediaType: 'image/jpeg' }))
}))

import ScorecardLogger from '../src/components/ScorecardLogger'

const PARS = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]
const STROKES = [5, 4, 6, 5, 4, 3, 5, 6, 5, 5, 4, 4, 6, 5, 3, 5, 6, 5] // 43 + 43 = 86

function player (name, strokes = STROKES, extra = {}) {
  return {
    name,
    scores: strokes.map((s, i) => ({ hole: i + 1, strokes: s, legible: true })),
    out: strokes.slice(0, 9).reduce((a, b) => a + b, 0),
    in: strokes.slice(9).reduce((a, b) => a + b, 0),
    total: strokes.reduce((a, b) => a + b, 0),
    printed: { out: null, in: null, total: null },
    mismatch: false,
    ...extra
  }
}

function proposal (overrides = {}) {
  return {
    card: {
      course_name: 'Titirangi',
      date_played: null,
      tee: 'White',
      course_rating: 71.2,
      slope: 128,
      hole_count: 18,
      par_total: 72,
      holes: PARS.map((par, i) => ({ hole: i + 1, par, distance: 300 + i, stroke_index: i + 1 }))
    },
    players: [player('Ben')],
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

async function upload () {
  const file = new File(['x'], 'card.jpg', { type: 'image/jpeg' })
  await userEvent.upload(screen.getByLabelText('Scorecard photo'), file)
}

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset())
  api.addPlayRound.mockResolvedValue({ id: 'r1' })
})

describe('ScorecardLogger', () => {
  test('shows every hole and saves nothing until confirmed', async () => {
    api.parseScorecard.mockResolvedValue(proposal())
    render(<ScorecardLogger onSaved={() => {}} />)

    await upload()

    expect(await screen.findByRole('form', { name: 'Check your scorecard' })).toBeInTheDocument()
    expect(screen.getByLabelText('Hole 1 score')).toHaveValue(5)
    expect(screen.getByLabelText('Hole 18 score')).toHaveValue(5)
    expect(screen.getByText('86')).toBeInTheDocument()
    expect(api.addPlayRound).not.toHaveBeenCalled()
    expect(api.parseScorecard).toHaveBeenCalledWith({ image: 'AAAA', mediaType: 'image/jpeg' })
  })

  test('needs a date before it can be saved, then saves the whole card', async () => {
    api.parseScorecard.mockResolvedValue(proposal())
    const onSaved = vi.fn()
    render(<ScorecardLogger onSaved={onSaved} />)
    await upload()
    await screen.findByRole('form', { name: 'Check your scorecard' })

    expect(screen.getByRole('button', { name: 'Save round' })).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Date played'), '2026-09-20')
    await userEvent.click(screen.getByRole('button', { name: 'Save round' }))

    await waitFor(() => expect(api.addPlayRound).toHaveBeenCalledTimes(1))
    const saved = api.addPlayRound.mock.calls[0][0]
    expect(saved).toMatchObject({
      courseId: 1, datePlayed: '2026-09-20', score: 86, holes: 18, par: 72,
      courseRating: 71.2, slope: 128, tee: 'White', source: 'scorecard'
    })
    expect(saved.holeScores).toHaveLength(18)
    expect(saved.holeScores[0]).toEqual({ hole: 1, strokes: 5, par: 4 })
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.stringMatching(/Scorecard saved: 86 at Titirangi Golf Club/)))
  })

  test('recomputes the total when a misread hole is corrected', async () => {
    api.parseScorecard.mockResolvedValue(proposal({ players: [player('Ben', STROKES, { printed: { out: null, in: null, total: 90 }, mismatch: true })] }))
    render(<ScorecardLogger onSaved={() => {}} />)
    await upload()
    await screen.findByRole('form', { name: 'Check your scorecard' })

    expect(screen.getByText(/The card says 90, but the holes add to 86/)).toBeInTheDocument()

    const hole = screen.getByLabelText('Hole 3 score')
    await userEvent.clear(hole)
    await userEvent.type(hole, '10')

    await waitFor(() => expect(screen.queryByText(/The card says 90/)).not.toBeInTheDocument())
  })

  test('will not save while a hole is blank or out of range', async () => {
    const strokes = [...STROKES]
    const raw = player('Ben', strokes)
    raw.scores[6] = { hole: 7, strokes: null, legible: true }
    api.parseScorecard.mockResolvedValue(proposal({ players: [raw] }))
    render(<ScorecardLogger onSaved={() => {}} />)
    await upload()
    await screen.findByRole('form', { name: 'Check your scorecard' })
    await userEvent.type(screen.getByLabelText('Date played'), '2026-09-20')

    expect(screen.getByRole('button', { name: 'Save round' })).toBeDisabled()
    expect(screen.getByText(/Fill in every hole/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Hole 7 score'), '4')
    expect(screen.getByRole('button', { name: 'Save round' })).toBeEnabled()

    const hole = screen.getByLabelText('Hole 7 score')
    await userEvent.clear(hole)
    await userEvent.type(hole, '40')
    expect(screen.getByRole('button', { name: 'Save round' })).toBeDisabled()
  })

  test('asks which row is you when the card has several players, and saves that row', async () => {
    api.parseScorecard.mockResolvedValue(proposal({
      players: [player('Ben'), player('Sam', STROKES.map((s) => s + 1))]
    }))
    render(<ScorecardLogger onSaved={() => {}} />)
    await upload()
    await screen.findByRole('form', { name: 'Check your scorecard' })
    await userEvent.type(screen.getByLabelText('Date played'), '2026-09-20')

    expect(screen.queryByLabelText('Hole 1 score')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save round' })).toBeDisabled()

    await userEvent.click(screen.getByLabelText(/Sam/))
    await userEvent.click(screen.getByRole('button', { name: 'Save round' }))

    await waitFor(() => expect(api.addPlayRound).toHaveBeenCalledTimes(1))
    expect(api.addPlayRound.mock.calls[0][0]).toMatchObject({ score: 104 })
  })

  test('highlights hard-to-read holes until they are edited', async () => {
    const raw = player('Ben')
    raw.scores[3] = { hole: 4, strokes: 5, legible: false }
    api.parseScorecard.mockResolvedValue(proposal({ players: [raw], warnings: ['Ben: 1 score is hard to read. Check the highlighted holes.'] }))
    render(<ScorecardLogger onSaved={() => {}} />)
    await upload()
    await screen.findByRole('form', { name: 'Check your scorecard' })

    const cell = screen.getByLabelText('Hole 4 score').closest('td')
    expect(cell).toHaveClass('is-doubtful')
    expect(screen.getByText(/hard to read/)).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Hole 4 score'))
    await userEvent.type(screen.getByLabelText('Hole 4 score'), '5')
    expect(screen.getByLabelText('Hole 4 score').closest('td')).not.toHaveClass('is-doubtful')
  })

  test('offers a search when the course is not in the list', async () => {
    api.parseScorecard.mockResolvedValue(proposal({
      card: { ...proposal().card, course_name: 'Augusta National' },
      course: { best: null, confident: false, candidates: [] },
      missing: ['course']
    }))
    api.searchCourses.mockResolvedValue([{ id: 9, name: 'Some Other Course', city: 'Napier' }])
    render(<ScorecardLogger onSaved={() => {}} />)
    await upload()

    expect(await screen.findByText(/is not in the course list/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Search for a course from the scorecard'), 'other')
    await userEvent.click(within(screen.getByRole('form', { name: 'Check your scorecard' })).getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('option', { name: /Some Other Course/ })).toBeInTheDocument()
  })

  test('shows the error when the photo cannot be read', async () => {
    api.parseScorecard.mockRejectedValue(new Error("Couldn't read that scorecard. Try a clearer, straighter photo."))
    render(<ScorecardLogger onSaved={() => {}} />)

    await upload()

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't read that scorecard")
    expect(screen.queryByRole('form', { name: 'Check your scorecard' })).not.toBeInTheDocument()
  })
})
