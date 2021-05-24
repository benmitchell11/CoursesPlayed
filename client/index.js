import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router } from 'react-router-dom'
import { UserProvider } from './components/UserContext'



import App from './components/App'



document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Router>
      
        <App />
      
    </Router>,
    document.getElementById('app')
  )
})