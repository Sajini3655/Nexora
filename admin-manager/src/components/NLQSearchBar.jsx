import React, { useEffect, useRef, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'
import { useNLQNavigation } from '../hooks/useNLQNavigation'
import './NLQSearchBar.css'

export const NLQSearchBar = () => {
  const wrapperRef = useRef(null)
  const [query, setQuery] = useState('')
  const { navigateByQuery, isLoading, error, availableRoutes } = useNLQNavigation()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  useEffect(() => {
    if (error) {
      setToastOpen(true)
    }
  }, [error])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const success = await navigateByQuery(query)
    if (success) {
      setQuery('')
      setShowSuggestions(false)
    }
  }

  const handleRouteClick = (path) => {
    navigateByQuery(`Go to ${path}`)
    setShowSuggestions(false)
  }

  const filteredSuggestions = availableRoutes.filter(route =>
    route.label.toLowerCase().includes(query.toLowerCase()) ||
    route.keywords.some(kw => kw.includes(query.toLowerCase()))
  )

  return (
    <div className="nlq-search-container" ref={wrapperRef}>
      <form onSubmit={handleSearch} className="nlq-search-form" role="search">
        <input
          type="text"
          placeholder="Type where you want to go..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              handleSearch(e)
            }
          }}
          disabled={isLoading}
          className="nlq-search-input"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="nlq-search-button"
        >
          {isLoading ? '⏳' : '🔍'}
        </button>
      </form>

      {showSuggestions && query && filteredSuggestions.length > 0 && (
        <div className="nlq-suggestions">
          {filteredSuggestions.map(route => (
            <button
              key={route.path}
              type="button"
              onClick={() => handleRouteClick(route.path)}
              className="nlq-suggestion-item"
            >
              {route.label}
            </button>
          ))}
        </div>
      )}

      <Snackbar
        open={toastOpen}
        autoHideDuration={2800}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="warning" variant="filled" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default NLQSearchBar
