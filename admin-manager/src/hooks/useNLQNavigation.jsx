import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext.jsx'
import { loadTasks } from '../dev/data/taskStore'
import { syncAssignedTasksToLocalStoreSafe } from '../dev/data/taskApi'
import { loadDeveloperTicketsFromBackendSafe } from '../dev/data/ticketApi'
import { loadUserTickets } from '../dev/data/ticketStore'
import { fetchClientProjects, fetchClientTickets } from '../client/services/clientService'
import { fetchProjects as fetchManagerProjects } from '../services/managerService'

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
    roles: ['ADMIN']
  },
  {
    path: '/profile',
    label: 'Profile',
    keywords: ['profile', 'account', 'my profile'],
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
    keywords: ['project management', 'manage project', 'manage projects', 'projects management', 'project list'],
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
    label: 'Client Workstreams',
    keywords: ['client projects', 'projects', 'my projects', 'workstream', 'workstreams', 'support workstream', 'support workstreams'],
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

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value) {
  const stopWords = new Set(['a', 'an', 'and', 'for', 'go', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'open', 'show', 'take', 'to', 'the', 'view'])
  return normalizeText(value)
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part && !stopWords.has(part))
}

function isTypoMatch(a, b) {
  const left = normalizeText(a)
  const right = normalizeText(b)
  if (!left || !right) return false
  if (left === right) return true

  const maxLen = Math.max(left.length, right.length)
  if (maxLen <= 2) return false

  const distance = levenshtein(left, right)
  const allowedDistance = maxLen <= 5 ? 1 : 2
  if (distance > allowedDistance) return false

  const similarity = 1 - distance / maxLen
  return similarity >= 0.62
}

function tokenOverlapScore(queryTokens, candidateTokens) {
  let exact = 0
  let typo = 0

  for (const c of candidateTokens) {
    if (queryTokens.includes(c)) {
      exact += 1
      continue
    }

    if (queryTokens.some((q) => isTypoMatch(q, c))) {
      typo += 1
    }
  }

  return { exact, typo }
}

function buildDevProjects(tasks) {
  const groups = new Map()

  tasks.forEach((task) => {
    const key = String(task?.projectId || task?.projectName || 'project-unknown')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(task)
  })

  return [...groups.entries()].map(([key, list]) => ({
    id: String(list[0]?.projectId || key),
    name: list[0]?.projectName || `Project ${key}`
  }))
}

function extractEntityTarget(rawQuery, intentWords) {
  const normalized = normalizeText(rawQuery)
  if (!normalized) return ''

  const escapedIntent = intentWords
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  if (!escapedIntent) return normalized

  const intentRegex = new RegExp(`(?:${escapedIntent})\\s+(.+)$`)
  const match = normalized.match(intentRegex)
  const base = (match?.[1] || normalized)
    .replace(/^(for|named|name|called|with|the)\s+/, '')
    .replace(/\s+(page|screen|view)$/g, '')
    .trim()

  return base || normalized
}

function scoreEntityCandidate(query, targetName, candidate) {
  const normalizedQuery = normalizeText(query)
  const normalizedTarget = normalizeText(targetName)
  const rawLabel = candidate?.name || candidate?.title || candidate?.projectName || ''
  const candidateName = normalizeText(rawLabel)
  const candidateId = normalizeText(candidate?.id)

  if (!candidateName && !candidateId) return 0

  let score = 0

  if (candidateId && (normalizedQuery.includes(candidateId) || normalizedTarget.includes(candidateId))) {
    score += 90
  }

  if (candidateName && (normalizedQuery.includes(candidateName) || normalizedTarget.includes(candidateName))) {
    score += 120
  }

  if (candidateName && isTypoMatch(normalizedTarget, candidateName)) {
    score += 90
  }

  const queryTokens = tokenize(normalizedTarget || normalizedQuery)
  const nameTokens = tokenize(candidateName)
  const { exact, typo } = tokenOverlapScore(queryTokens, nameTokens)
  score += exact * 24
  score += typo * 16

  return score
}

function getBestEntityMatch(query, targetName, candidates) {
  let best = null
  let bestScore = 0

  for (const candidate of candidates) {
    const score = scoreEntityCandidate(query, targetName, candidate)
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }

  if (!best) return null
  return bestScore >= 56 ? best : null
}

function scoreRoute(query, route) {
  const normalizedQuery = normalizeText(query)
  const queryTokens = tokenize(query)
  const routeLabel = normalizeText(route.label)
  const routeKeywords = route.keywords.map((keyword) => normalizeText(keyword))

  if (!normalizedQuery) return 0

  if (route.path === '/profile') {
    const profileIntent = queryTokens.some((token) =>
      ['profile', 'account'].some((target) => isTypoMatch(token, target))
    )
    if (!profileIntent) return 0
  }

  let score = 0

  const hasProjectIntent = queryTokens.some((token) => ['project', 'projects'].some((target) => isTypoMatch(token, target)))
  const hasManagementIntent = queryTokens.some((token) => ['management', 'manage', 'managment', 'amnagement'].some((target) => isTypoMatch(token, target)))
  const hasAddIntent = queryTokens.some((token) => ['add', 'new', 'create'].some((target) => isTypoMatch(token, target)))
  const hasWorkstreamIntent = queryTokens.some((token) => ['workstream', 'workstreams', 'stream', 'streams'].some((target) => isTypoMatch(token, target)))

  if (route.path === '/manager/project-management') {
    if (hasProjectIntent) score += 18
    if (hasManagementIntent) score += 28
    if (hasProjectIntent && hasManagementIntent) score += 24
  }

  if (route.path === '/manager/add-project') {
    if (hasAddIntent) score += 26
    if (hasProjectIntent) score += 8
    if (hasManagementIntent) score -= 24
  }

  if (route.path === '/client/projects') {
    if (hasWorkstreamIntent) score += 34
    if (hasProjectIntent) score += 12
    if (hasWorkstreamIntent && hasProjectIntent) score += 20
  }

  if (normalizedQuery === routeLabel) score += 110
  else if (isTypoMatch(normalizedQuery, routeLabel)) score += 75

  if (routeLabel.includes(normalizedQuery) || normalizedQuery.includes(routeLabel)) {
    score += 45
  }

  for (const keyword of routeKeywords) {
    if (!keyword) continue
    if (normalizedQuery === keyword) score += 110
    else if (isTypoMatch(normalizedQuery, keyword)) score += 85
    else if (normalizedQuery.includes(keyword) || keyword.includes(normalizedQuery)) score += 40

    const keywordTokens = keyword.split(' ').filter(Boolean)
    const { exact, typo } = tokenOverlapScore(queryTokens, keywordTokens)
    score += exact * 14
    score += typo * 11
  }

  const combined = [routeLabel, ...routeKeywords].join(' ')
  const distance = levenshtein(normalizedQuery, combined)
  const similarity = 1 - distance / Math.max(normalizedQuery.length, combined.length, 1)
  if (similarity > 0.82) score += 20
  else if (similarity > 0.7) score += 8

  return score
}

function bestRouteMatch(query, routes) {
  let best = null
  let bestScore = 0

  for (const route of routes) {
    const score = scoreRoute(query, route)
    if (score > bestScore) {
      bestScore = score
      best = route
    }
  }

  if (!best) return null

  const normalized = normalizeText(query)
  const threshold = normalized.length <= 4 ? 46 : normalized.length <= 8 ? 24 : 18
  return bestScore >= threshold ? { route: best, score: bestScore } : null
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

  const resolveEntityNavigation = async (query, allowedRoutes) => {
    const role = (user?.role || '').toUpperCase()
    const tokens = tokenize(query)

    const hasProjectIntent = tokens.some((token) => ['project', 'projects', 'workstream', 'workstreams'].some((target) => isTypoMatch(token, target)))
    const hasTaskIntent = tokens.some((token) => ['task', 'tasks'].some((target) => isTypoMatch(token, target)))
    const hasTicketIntent = tokens.some((token) => ['ticket', 'tickets', 'issue', 'issues'].some((target) => isTypoMatch(token, target)))

    if (role === 'MANAGER') {
      if (hasProjectIntent && allowedRoutes.some((route) => route.path === '/manager/project-management')) {
        try {
          const projects = await fetchManagerProjects()
          const targetName = extractEntityTarget(query, ['project', 'projects'])
          const match = getBestEntityMatch(query, targetName, Array.isArray(projects) ? projects : [])
          if (match?.id) {
            navigate(`/manager/project-management/${encodeURIComponent(String(match.id))}`)
            return true
          }
        } catch {
          // Continue with route-level NLQ if project fetch fails
        }
      }
    }

    if (role === 'DEVELOPER') {
      if (hasProjectIntent && allowedRoutes.some((route) => route.path === '/dev/projects')) {
        const syncedTasks = await syncAssignedTasksToLocalStoreSafe()
        const tasks = Array.isArray(syncedTasks) ? syncedTasks : loadTasks()
        const projects = buildDevProjects(tasks)
        const targetName = extractEntityTarget(query, ['project', 'projects'])
        const match = getBestEntityMatch(query, targetName, projects)
        if (match?.id) {
          navigate(`/dev/projects/${encodeURIComponent(String(match.id))}`)
          return true
        }
      }

      if (hasTaskIntent && allowedRoutes.some((route) => route.path === '/dev/tasks')) {
        const syncedTasks = await syncAssignedTasksToLocalStoreSafe()
        const tasks = Array.isArray(syncedTasks) ? syncedTasks : loadTasks()
        const targetName = extractEntityTarget(query, ['task', 'tasks'])
        const match = getBestEntityMatch(query, targetName, tasks)
        if (match?.id) {
          navigate(`/dev/tasks/${encodeURIComponent(String(match.id))}`)
          return true
        }
      }

      if (hasTicketIntent && allowedRoutes.some((route) => route.path === '/dev/tasks')) {
        const backendTickets = await loadDeveloperTicketsFromBackendSafe()
        const localTickets = loadUserTickets()
        const tickets = Array.isArray(backendTickets) && backendTickets.length ? backendTickets : localTickets
        const targetName = extractEntityTarget(query, ['ticket', 'tickets', 'issue', 'issues'])
        const match = getBestEntityMatch(query, targetName, tickets)
        if (match?.id) {
          navigate(`/dev/tickets/${encodeURIComponent(String(match.id))}`)
          return true
        }
      }
    }

    if (role === 'CLIENT') {
      if (hasProjectIntent && allowedRoutes.some((route) => route.path === '/client/projects')) {
        const projects = await fetchClientProjects()
        const targetName = extractEntityTarget(query, ['project', 'projects', 'workstream', 'workstreams'])
        const match = getBestEntityMatch(query, targetName, Array.isArray(projects) ? projects : [])
        if (match?.name) {
          navigate(`/client/projects?q=${encodeURIComponent(String(match.name))}`)
          return true
        }
      }

      if ((hasTicketIntent || hasTaskIntent) && allowedRoutes.some((route) => route.path === '/client/tickets')) {
        const tickets = await fetchClientTickets()
        const targetName = extractEntityTarget(query, ['ticket', 'tickets', 'issue', 'issues', 'task', 'tasks'])
        const match = getBestEntityMatch(query, targetName, Array.isArray(tickets) ? tickets : [])
        if (match?.name || match?.title) {
          const needle = match?.title || match?.name
          navigate(`/client/tickets?q=${encodeURIComponent(String(needle))}`)
          return true
        }
      }
    }

    return false
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
      const entityResolved = await resolveEntityNavigation(query, allowedRoutes)
      if (entityResolved) {
        setIsLoading(false)
        return true
      }
    } catch {
      // Continue with existing route-level NLQ behavior if entity lookup fails.
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

    // Fallback to conservative matching
    const allowedMatch = findRouteByKeyword(query, allowedRoutes) || bestRouteMatch(query, allowedRoutes)
    if (allowedMatch) {
      navigate(allowedMatch.route ? allowedMatch.route.path : allowedMatch.path)
      setIsLoading(false)
      return true
    }

    const role = (user?.role || '').toUpperCase()
    const restrictedCatalog = ROUTE_CATALOG.filter((route) => !canAccessRoute(route, role, moduleAccess))
    const restrictedMatch = findRouteByKeyword(query, restrictedCatalog) || bestRouteMatch(query, restrictedCatalog)
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
    const normalized = normalizeText(query)
    const tokens = tokenize(query)
    
    for (const route of routes) {
      for (const keyword of route.keywords) {
        const normalizedKeyword = normalizeText(keyword)
        const keywordTokens = tokenize(keyword)

        if (!normalizedKeyword) continue

        if (normalized === normalizedKeyword) {
          return route
        }

        if (normalized.includes(normalizedKeyword) || normalizedKeyword.includes(normalized)) {
          return route
        }

        const { exact, typo } = tokenOverlapScore(tokens, keywordTokens)
        if (exact >= 2 || (exact >= 1 && typo >= 1) || typo >= 2) {
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
