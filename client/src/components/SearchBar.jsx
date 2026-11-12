import React, { useState } from 'react'

function SearchBar ({ onSearch }) {
  const [term, setTerm] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch(term)
  }

  return (
    <form className="field has-addons" onSubmit={handleSubmit}>
      <div className="control is-expanded">
        <input
          className="input" type="text" placeholder="Search courses by name or city"
          value={term} onChange={(event) => setTerm(event.target.value)}
        />
      </div>
      <div className="control">
        <button type="submit" className="button is-primary">Search</button>
      </div>
    </form>
  )
}

export default SearchBar
