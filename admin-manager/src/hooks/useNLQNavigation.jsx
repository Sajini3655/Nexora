import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext.jsx'

const ROUTE_CATALOG = [
  {
    path: '/admin',
    label: 'Admin Dashboard',
    keywords: ['dashboard', 'admin dashboard', 'home', 'overview', 'analytics', 'stats'],
    roles: ['ADMIN']
  },
  {
    path: '/access',
    label: 'Access Control',
    keywords: ['access', 'permissions', 'roles', 'security', 'auth'],
    roles: ['ADMIN']
  },
  {
    path: '/settings',
    label: 'Admin Settings',
    keywords: ['settings', 'preferences', 'configuration', 'config'],
    roles: ['ADMIN']
  },
  {
    path: '/users',
    label: 'Users',
    keywords: ['users', 'team', 'members', 'people', 'user management'],
    roles: ['ADMIN', 'MANAGER']
  },
  {
    path: '/profile',
    label: 'Profile',
    keywords: ['profile', 'account', 'my account', 'me'],
    roles: ['ADMIN', 'MANAGER']
  },
  {
    path: '/manager',
    label: 'Manager Dashboard',
    keywords: ['manager', 'manager dashboard', 'dashboard', 'overview', 'home'],
    roles: ['MANAGER'],
    requiredModule: 'DASHBOARD'
  },
  {
    path: '/manager/add-project',
    label: 'Add Project',
    keywords: ['add project', 'new project', 'create project'],
    roles: ['MANAGER'],
    requiredModule: 'FILES'
  },
  {
    path: '/manager/project-management',
    label: 'Project Management',
    keywords: ['project management', 'manage projects', 'projects', 'project list'],
    roles: ['MANAGER'],
    requiredModule: 'FILES'
  },
  {
    path: '/manager/ai-assignment',
    label: 'AI Task Assignment',
    keywords: ['ai', 'task assignment', 'tasks', 'assignments'],
    roles: ['MANAGER'],
    requiredModule: 'TASKS'
  },
  {
    path: '/dev',
    label: 'Developer Dashboard',
    keywords: ['developer dashboard', 'dev dashboard', 'dev home', 'dashboard'],
    roles: ['DEVELOPER'],
    requiredModule: 'DASHBOARD'
  },
  {
    path: '/dev/projects',
    label: 'Developer Projects',
    keywords: ['dev projects', 'projects', 'developer projects'],
    roles: ['DEVELOPER'],
    requiredModule: 'FILES'
  },
  {
    path: '/dev/tasks',
    label: 'Developer Tasks',
    keywords: ['tasks', 'dev tasks', 'developer tasks'],
    roles: ['DEVELOPER'],
    requiredModule: 'TASKS'
  },
  {
    path: '/dev/chat',
    label: 'Developer Chat',
    keywords: ['chat', 'developer chat', 'team chat', 'messages'],
    roles: ['DEVELOPER'],
    requiredModule: 'CHAT'
  },
  {
    path: '/dev/profile',
    label: 'Developer Profile',
    keywords: ['profile', 'dev profile', 'developer profile', 'account'],
    roles: ['DEVELOPER']
  },
  {
    path: '/dev/settings',
    label: 'Developer Settings',
    keywords: ['settings', 'dev settings', 'developer settings', 'preferences'],
    roles: ['DEVELOPER']
  },
  {
    path: '/client',
    label: 'Client Dashboard',
    keywords: ['client dashboard', 'client home', 'dashboard', 'home'],
    roles: ['CLIENT']
  },
  {
    path: '/client/projects',
    label: 'Client Projects',
    keywords: ['client projects', 'projects', 'my projects'],
    roles: ['CLIENT']
  },
  {
    path: '/client/tickets',
    label: 'Client Tickets',
    keywords: ['tickets', 'client tickets', 'support tickets', 'issues'],
    roles: ['CLIENT']
  },
  {
    path: '/client/profile',
    label: 'Client Profile',
    keywords: ['client profile', 'profile', 'account'],
    roles: ['CLIENT']
  },
  {
    path: '/client/settings',
    label: 'Client Settings',
    keywords: ['client settings', 'settings', 'preferences'],
    roles: ['CLIENT']
  }
]

function levenshtein(a, b) {
  const s = (a || '').toLowerCase()
  const t = (b || '').toLowerCase()
  const dp = Array.from({ length: s.length + 1 }, () => Array(t.length + 1).fill(0))

  for (let i = 0; i <= s.length; i += 1) dp[i][0] = i
  for (let j = 0; j <= t.length; j += 1) dp[0][j] = j

  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }

  return dp[s.length][t.length]
}

function bestFuzzyMatch(query, routes) {
  const normalized = query.toLowerCase().trim()
  let best = null
  let bestScore = Number.POSITIVE_INFINITY

  for (const route of routes) {
    const candidates = [route.label, ...route.keywords]
    for (const candidate of candidates) {
      const score = levenshtein(normalized, String(candidate).toLowerCase())
      if (score < bestScore) {
        bestScore = score
        best = route
      }
    }
  }

  if (!best) return null

  const threshold = Math.max(2, Math.floor(normalized.length * 0.35))
  return bestScore <= threshold ? best : null
}

function canAccessRoute(route, role, moduleAccess) {
  if (!route.roles.includes(role)) return false
  if (route.requiredModule && role !== 'ADMIN') {
    return Boolean(moduleAccess?.[route.requiredModule])
  }
  return true
}

export const useNLQNavigation = () => {
  const navigate = useNavigate()
  const { user, moduleAccess } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getAllowedRoutes = () => {
    const role = (user?.role || '').toUpperCase()

    return ROUTE_CATALOG.filter((route) => canAccessRoute(route, role, moduleAccess))
  }

  const navigateByQuery = async (query) => {
    if (!query || !query.trim()) {
      setError('Query cannot be empty')
      return false
    }

    setIsLoading(true)
    setError(null)

    const allowedRoutes = getAllowedRoutes()
    if (!allowedRoutes.length) {
      setError('No accessible pages available for your role.')
      setIsLoading(false)
      return false
    }

    try {
      // Try AI-powered NLQ navigation
      const response = await axios.post('http://localhost:3001/v1/navigate', {
        query,
        available_routes: allowedRoutes.map(({ path, label, keywords }) => ({ path, label, keywords }))
      })

      const { route, confidence } = response.data

      const isAllowedRoute = allowedRoutes.some((r) => r.path === route)
      if (route && isAllowedRoute && confidence > 0.2) {
        navigate(route)
        setIsLoading(false)
        return true
      }

      if (route && !isAllowedRoute) {
        setError('You do not have access to that page.')
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.warn('AI navigation failed, trying fallback:', err)
    }

    // Fallback to keyword + fuzzy matching
    const allowedMatch = findRouteByKeyword(query, allowedRoutes) || bestFuzzyMatch(query, allowedRoutes)
    if (allowedMatch) {
      navigate(allowedMatch.path)
      setIsLoading(false)
      return true
    }

    const role = (user?.role || '').toUpperCase()
    const restrictedCatalog = ROUTE_CATALOG.filter((route) => !canAccessRoute(route, role, moduleAccess))
    const restrictedMatch = findRouteByKeyword(query, restrictedCatalog) || bestFuzzyMatch(query, restrictedCatalog)
    if (restrictedMatch) {
      setError('You do not have access to that page.')
      setIsLoading(false)
      return false
    }

    setError('Could not determine navigation target. Please try a clearer query.')
    setIsLoading(false)
    return false
  }

  const findRouteByKeyword = (query, routes) => {
    const normalized = query.toLowerCase().trim()
    
    for (const route of routes) {
      for (const keyword of route.keywords) {
        if (keyword.includes(normalized) || normalized.includes(keyword)) {
          return route
        }
      }
    }
    
    return null
  }

  return {
    navigateByQuery,
    isLoading,
    error,
    availableRoutes: getAllowedRoutes()
  }
}
