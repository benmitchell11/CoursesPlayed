import React, { useState, createContext } from 'react'
import { getDecodedToken, isAuthenticated } from 'authenticare/client'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    username: '',
    isAdmin: '',
    id: null
  })

  return (
    <UserContext.Provider value={[user, setUser]}>
      {children}
    </UserContext.Provider>
  )
}
export const updateUserContext = (setUser) => {
  const { username, isAdmin, id } = getDecodedToken()
  return isAuthenticated() ? setUser({ username, isAdmin, id }) : null
}
