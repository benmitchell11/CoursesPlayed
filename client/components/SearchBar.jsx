import React, {useState} from 'react'
import { withRouter } from 'react-router'

function SearchBar () {

    return (
        <>
        <input className='searchBar' id='searchbar' placeholder='Search' type='text' />
        <button className='searchButton'>Search</button>
        </>
    )
}

export default SearchBar