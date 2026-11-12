import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../src/apiClient', () => ({
  register: vi.fn()
}))

import Register from '../src/pages/Register'
import { UserContext } from '../src/context/UserContext'
import { register } from '../src/apiClient'

function renderRegister (setUser = vi.fn()) {
  render(
    <MemoryRouter>
      <UserContext.Provider value={{ user: null, setUser, loading: false }}>
        <Register />
      </UserContext.Provider>
    </MemoryRouter>
  )
}

describe('Register', () => {
  beforeEach(() => {
    register.mockReset()
  })

  test('submits the form and updates user context on success', async () => {
    register.mockResolvedValueOnce({ id: 'uid-1', username: 'ben' })

    const setUser = vi.fn()
    renderRegister(setUser)

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'ben@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ben' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'hunter22' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => expect(setUser).toHaveBeenCalledWith({ id: 'uid-1', username: 'ben' }))
  })

  test('shows an error message when the username is taken', async () => {
    register.mockRejectedValueOnce(new Error('Username is already taken'))

    renderRegister()

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'ben@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ben' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'hunter22' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText('Username is already taken')).toBeInTheDocument()
  })
})
