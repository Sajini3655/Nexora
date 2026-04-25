# NLQ Navigation Feature - Implementation Guide

## Overview
This feature allows users to navigate the admin panel using natural language queries. Users can type commands like "Go to users", "Show dashboard", or "Navigate to settings" in the search bar, and the AI service will intelligently route them to the appropriate page.

## Files Created

### 1. Frontend Components
- `src/hooks/useNLQNavigation.jsx` - Custom hook for NLQ navigation logic
- `src/components/NLQSearchBar.jsx` - Search bar component with suggestions
- `src/components/NLQSearchBar.css` - Styling for the search bar

### 2. Backend Endpoint
- `ai-service/main.py` - Added `/v1/navigate` POST endpoint

## Integration Steps

### Step 1: Add NLQSearchBar to ManagerTopbar

Update your `src/components/layout/ManagerTopbar.jsx`:

```jsx
import { NLQSearchBar } from '../NLQSearchBar'

const ManagerTopbar = ({ onMenuToggle }) => {
  return (
    <div className="topbar">
      {/* Existing topbar code */}
      <button className="menu-toggle" onClick={onMenuToggle}>
        ☰
      </button>
      
      {/* Add the NLQ Search Bar */}
      <div className="topbar-search-section">
        <NLQSearchBar />
      </div>
      
      {/* Rest of topbar content */}
    </div>
  )
}

export default ManagerTopbar
```

### Step 2: Add CSS for topbar layout

Add this to your topbar CSS file:

```css
.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
}

.topbar-search-section {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
}

.menu-toggle {
  padding: 8px 12px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.menu-toggle:hover {
  background-color: #f3f4f6;
}
```

## Usage Examples

Users can type various natural language queries:

- **Navigation**
  - "Go to dashboard"
  - "Show me users"
  - "Navigate to settings"
  - "Take me to my profile"

- **Feature-specific**
  - "Show access control"
  - "Go to AI"
  - "Show projects"
  - "View team members"

- **Casual queries**
  - "Home"
  - "Profile"
  - "Users"
  - "Projects"

## Available Routes

The feature supports navigation to:

1. **Dashboard** (`/admin/dashboard`)
   - Keywords: dashboard, home, overview, main, analytics, stats

2. **Users Management** (`/admin/users`)
   - Keywords: users, team, members, people, manage users, user list

3. **Projects** (`/admin/projects`)
   - Keywords: projects, project, work, initiatives

4. **Access Control** (`/admin/access`)
   - Keywords: access, permissions, roles, auth, security

5. **Settings** (`/admin/settings`)
   - Keywords: settings, preferences, configuration, config

6. **Profile** (`/admin/profile`)
   - Keywords: profile, account, personal, my account

7. **AI** (`/admin/ai`)
   - Keywords: ai, artificial intelligence, machine learning

## How It Works

### Flow Diagram

```
User Input
    ↓
NLQSearchBar Component
    ↓
useNLQNavigation Hook
    ↓
AI Service (/v1/navigate)
    ↓
OpenAI API (Parse Intent)
    ↓
Return Route
    ↓
Fallback: Keyword Matching (if AI fails)
    ↓
Navigate using React Router
```

### Error Handling

The system has multiple fallback layers:

1. **Primary**: AI-powered NLQ understanding via OpenAI
2. **Secondary**: Keyword matching on route labels and keywords
3. **Tertiary**: User-friendly error message

## Configuration

### Environment Variables

Make sure these are in your `.env`:
- `FRONTEND_URL=http://localhost:5173` (already configured)
- `GROQ_API_KEY` (for AI service, if using Groq instead of OpenAI)

### API Endpoint

The NLQ navigation endpoint is at:
```
POST http://localhost:3001/v1/navigate
```

## Testing

### Local Testing

1. **Start the AI service**:
   ```bash
   cd Nexora/ai-service
   python main.py
   ```

2. **Start the admin-manager**:
   ```bash
   cd Nexora/admin-manager
   npm run dev
   ```

3. **Test queries in the search bar**:
   - Type "Go to users" → Navigate to `/admin/users`
   - Type "Show dashboard" → Navigate to `/admin/dashboard`
   - Type "Settings" → Navigate to `/admin/settings`

### Curl Test (for backend only)

```bash
curl -X POST http://localhost:3001/v1/navigate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Go to users",
    "available_routes": [
      {
        "path": "/admin/dashboard",
        "label": "Dashboard",
        "keywords": ["dashboard", "home"]
      }
    ]
  }'
```

## Customization

### Adding New Routes

Edit the `AVAILABLE_ROUTES` constant in `src/hooks/useNLQNavigation.jsx`:

```jsx
const AVAILABLE_ROUTES = [
  // ... existing routes
  {
    path: '/admin/new-page',
    label: 'New Page',
    keywords: ['new', 'newpage', 'feature']
  }
]
```

### Adjusting Confidence Threshold

In `src/hooks/useNLQNavigation.jsx`, modify the threshold:

```jsx
if (route && confidence > 0.5) {  // Changed from 0.3 to 0.5
  navigate(route)
  return true
}
```

## Troubleshooting

### Search bar not working?

1. **Check AI service is running**:
   ```bash
   curl http://localhost:3001/
   ```

2. **Check CORS**:
   - AI service should have CORS enabled
   - Frontend should be able to reach `http://localhost:3001`

3. **Check console errors**:
   - Open browser dev tools (F12)
   - Look for network errors in Network tab
   - Check Console tab for JavaScript errors

### Routes not being recognized?

1. **Verify route keywords**:
   - Check if keywords match user input
   - Keywords are case-insensitive
   - Use variations of common terms

2. **Test with simpler queries**:
   - Instead of "Take me to the user management panel"
   - Try "Go to users"

## Performance

- **Keyword matching**: Instant (< 10ms)
- **AI-powered routing**: ~500-1000ms (includes API call)
- **Overall UX**: Smooth with loading state

## Future Enhancements

- [ ] Cache frequent queries for faster response
- [ ] Learn from user behavior (click patterns)
- [ ] Add voice input support
- [ ] Multi-language support
- [ ] Fuzzy matching for typos
- [ ] Analytics on most used navigation paths
