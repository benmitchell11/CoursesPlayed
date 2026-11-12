import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../src/apiClient', () => ({
  signIn: vi.fn()
}))

import SignIn from '../src/pages/SignIn'
import { UserContext } from '../src/context/UserContext'
import { signIn } from '../src/apiClient'

function renderSignIn (setUser = vi.fn()) {
  render(
    <MemoryRouter>
      <UserContext.Provider value={{ user: null, setUser, loading: false }}>
        <SignIn />
      </UserContext.Provider>
    </MemoryRouter>
  )
}

describe('SignIn', () => {
  beforeEach(() => {
    signIn.mockReset()
  })

  test('submits credentials and updates user context on success', async () => {
    signIn.mockResolvedValueOnce({ id: 'uid-1', username: 'ben' })

    const setUser = vi.fn()
    renderSignIn(setUser)

    fireEvent.change(screen.getByPlaceholderText('Username or email'), { target: { value: 'ben' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'hunter22' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(setUser).toHaveBeenCalledWith({ id: 'uid-1', username: 'ben' }))
    expect(signIn).toHaveBeenCalledWith({ username: 'ben', password: 'hunter22' })
  })

  test('shows an error message on failed sign in', async () => {
    signIn.mockRejectedValueOnce(new Error('Incorrect username/email or password'))

    renderSignIn()

    fireEvent.change(screen.getByPlaceholderText('Username or email'), { target: { value: 'ben' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Incorrect username/email or password')).toBeInTheDocument()
  })
})
