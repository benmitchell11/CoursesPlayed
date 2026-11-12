import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

const api = vi.hoisted(() => ({
  askChat: vi.fn(),
  getMyPlayedCourses: vi.fn(),
  getMyPlayRounds: vi.fn()
}))

vi.mock('../src/apiClient', () => api)

import ChatWidget from '../src/components/ChatWidget'
import { UserContext } from '../src/context/UserContext'

function renderWidget (user = null) {
  return render(
    <UserContext.Provider value={{ user, setUser: vi.fn(), loading: false }}>
      <ChatWidget />
    </UserContext.Provider>
  )
}

beforeEach(() => {
  api.askChat.mockReset()
  api.getMyPlayedCourses.mockReset()
  api.getMyPlayRounds.mockReset()
})

describe('ChatWidget', () => {
  test('starts closed, with no chat panel on screen', () => {
    renderWidget()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ai chatbot/i })).toBeInTheDocument()
  })

  test("opening shows TeeBox's greeting, and closing keeps the conversation for next time", async () => {
    api.askChat.mockResolvedValueOnce({ reply: 'Titirangi is a par 70.' })
    renderWidget()

    await userEvent.click(screen.getByRole('button', { name: /ai chatbot/i }))
    expect(screen.getByRole('dialog', { name: 'AI Chatbot' })).toBeInTheDocument()
    expect(screen.getByText(/Hi I'm TeeBox, your AI assistant/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Ask a question'), "What's the par for Titirangi?")
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText('Titirangi is a par 70.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /close chat/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /ai chatbot/i }))
    expect(screen.getByText('Titirangi is a par 70.')).toBeInTheDocument()
  })

  test('a personal question fetches the matching client data and asks again with it', async () => {
    api.askChat
      .mockResolvedValueOnce({ needsData: { intent: 'courses_remaining', args: { location: 'Auckland' }, fetch: 'getMyPlayedCourses' } })
      .mockResolvedValueOnce({ reply: 'You have 1 Auckland course left.' })
    api.getMyPlayedCourses.mockResolvedValueOnce([{ course_id: 1 }])

    renderWidget({ uid: 'u1' })
    await userEvent.click(screen.getByRole('button', { name: /ai chatbot/i }))
    await userEvent.type(screen.getByLabelText('Ask a question'), 'How many Auckland courses do I have left?')
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))

    expect(await screen.findByText('You have 1 Auckland course left.')).toBeInTheDocument()
    expect(api.getMyPlayedCourses).toHaveBeenCalledTimes(1)
    expect(api.askChat).toHaveBeenNthCalledWith(2, 'How many Auckland courses do I have left?', {
      context: { intent: 'courses_remaining', args: { location: 'Auckland' }, data: [{ course_id: 1 }] }
    })
  })

  test('a second message sends the first exchange along as history, so a short follow-up can be understood', async () => {
    api.askChat
      .mockResolvedValueOnce({ reply: 'There are 40 courses in Auckland.' })
      .mockResolvedValueOnce({ reply: 'There are 16 courses in Wellington.' })
    renderWidget()

    await userEvent.click(screen.getByRole('button', { name: /ai chatbot/i }))
    await userEvent.type(screen.getByLabelText('Ask a question'), 'What courses are in Auckland?')
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText('There are 40 courses in Auckland.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Ask a question'), 'What about Wellington instead?')
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText('There are 16 courses in Wellington.')).toBeInTheDocument()

    expect(api.askChat).toHaveBeenNthCalledWith(1, 'What courses are in Auckland?', { history: [] })
    expect(api.askChat).toHaveBeenNthCalledWith(2, 'What about Wellington instead?', {
      history: [
        { role: 'user', text: 'What courses are in Auckland?' },
        { role: 'assistant', text: 'There are 40 courses in Auckland.' }
      ]
    })
  })

  test('a handicap question is answered from the signed-in user already in context, with no network fetch', async () => {
    api.askChat
      .mockResolvedValueOnce({ needsData: { intent: 'my_handicap', args: {}, fetch: 'getMyHandicap' } })
      .mockResolvedValueOnce({ reply: 'Your handicap is 14.2.' })

    renderWidget({ uid: 'u1', handicap: 14.2 })
    await userEvent.click(screen.getByRole('button', { name: /ai chatbot/i }))
    await userEvent.type(screen.getByLabelText('Ask a question'), "What's my handicap?")
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))

    expect(await screen.findByText('Your handicap is 14.2.')).toBeInTheDocument()
    expect(api.getMyPlayedCourses).not.toHaveBeenCalled()
    expect(api.getMyPlayRounds).not.toHaveBeenCalled()
    expect(api.askChat).toHaveBeenNthCalledWith(2, "What's my handicap?", {
      context: { intent: 'my_handicap', args: {}, data: { handicap: 14.2 } }
    })
  })

  test('shows a message-level error without crashing the widget', async () => {
    api.askChat.mockRejectedValueOnce(new Error('Chat is unavailable right now. Try again shortly.'))
    renderWidget()

    await userEvent.click(screen.getByRole('button', { name: /ai chatbot/i }))
    await userEvent.type(screen.getByLabelText('Ask a question'), "What's the par for Titirangi?")
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))

    expect(await screen.findByText('Chat is unavailable right now. Try again shortly.')).toBeInTheDocument()
  })
})
