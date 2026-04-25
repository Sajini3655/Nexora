# NLQ Navigation Feature - Quick Start Guide

## What's New? ✨

Your admin panel now has an intelligent search bar that understands natural language commands! Users can type questions like "Go to users" or "Show dashboard" and be instantly navigated there.

## Getting Started

### 1. Start the AI Service

```bash
cd Nexora/ai-service
python main.py
```

The AI service will start on `http://localhost:3001`.

### 2. Start the Admin Manager

In a new terminal:

```bash
cd Nexora/admin-manager
npm run dev
```

The admin panel will start on `http://localhost:5173`.

### 3. Test the Feature

1. Open your browser to `http://localhost:5173`
2. Look for the **search bar in the top navigation bar** (between the Nexora logo and user profile)
3. Try typing one of these commands:

#### Example Queries

**Dashboard Navigation**
- "Go to dashboard"
- "Show me the dashboard"
- "Take me home"

**User Management**
- "Go to users"
- "Show team members"
- "Navigate to user management"

**Settings & Configuration**
- "Go to settings"
- "Show me settings"
- "Settings"

**Other Pages**
- "Go to projects"
- "Navigate to access control"
- "Show my profile"
- "Go to AI"

## Features

✅ **AI-Powered Understanding** - Uses OpenAI to understand your intent
✅ **Smart Fallback** - Works even if AI service is unavailable
✅ **Auto-Complete Suggestions** - Shows relevant pages as you type
✅ **Instant Navigation** - Navigate with a single search
✅ **Loading State** - Visual feedback while processing

## How It Works

```
You type → Search bar captures input
          ↓
       AI Service analyzes intent
          ↓
       Routes you to best match
          ↓
    Page loads instantly
```

## Troubleshooting

### Search bar not appearing?
- Make sure you're using the latest code
- Check browser console (F12) for errors
- Refresh the page (Ctrl+F5)

### Search not working?
- Check AI service is running: `curl http://localhost:3001/`
- Check browser console for error messages
- Try a simpler query like "users" or "dashboard"

### Routes not found?
- The system has keyword matching fallback
- Try keywords from the AVAILABLE_ROUTES list
- Check the NLQ_NAVIGATION_GUIDE.md for supported queries

## Available Routes & Keywords

| Page | Path | Keywords |
|------|------|----------|
| Dashboard | `/admin/dashboard` | dashboard, home, overview, main, analytics |
| Users | `/admin/users` | users, team, members, people |
| Projects | `/admin/projects` | projects, project, work |
| Access Control | `/admin/access` | access, permissions, roles, auth |
| Settings | `/admin/settings` | settings, preferences, config |
| Profile | `/admin/profile` | profile, account, personal |
| AI | `/admin/ai` | ai, artificial intelligence |

## Common Issues & Solutions

### Issue: "Could not determine navigation target"
**Solution**: Try a simpler query with one keyword. Examples:
- Instead of: "Take me to the user administration panel"
- Try: "Go to users"

### Issue: Search hangs or times out
**Solution**: 
- Check AI service is running
- Restart the AI service
- Try the keyword matching fallback

### Issue: Page loads but search bar is empty
**Solution**:
- This is normal after navigation
- The search bar clears after successful navigation
- It's ready for the next query

## Files Modified

1. **Frontend**
   - ✅ `admin-manager/src/hooks/useNLQNavigation.jsx` - New hook
   - ✅ `admin-manager/src/components/NLQSearchBar.jsx` - New component
   - ✅ `admin-manager/src/components/NLQSearchBar.css` - New styles
   - ✅ `admin-manager/src/components/layout/ManagerTopbar.jsx` - Updated

2. **Backend**
   - ✅ `ai-service/main.py` - Added `/v1/navigate` endpoint

## Next Steps

1. **Test all routes** - Try navigating to each page using NLQ
2. **Gather feedback** - See how users interact with the feature
3. **Customize keywords** - Add your own keywords for better UX
4. **Monitor usage** - Track which queries are most common

## Advanced Configuration

### Add New Routes

Edit `src/hooks/useNLQNavigation.jsx`:

```jsx
const AVAILABLE_ROUTES = [
  // ...existing routes...
  {
    path: '/admin/my-new-page',
    label: 'My New Page',
    keywords: ['new', 'newpage', 'custom']
  }
]
```

### Adjust AI Confidence Threshold

In `src/hooks/useNLQNavigation.jsx`, find:

```jsx
if (route && confidence > 0.3) {  // Change this value
```

- **Lower value (0.1-0.3)**: More aggressive navigation, risk of wrong routes
- **Higher value (0.7-1.0)**: Conservative, falls back to keyword matching more often

### Change AI Model

Update the endpoint in `src/hooks/useNLQNavigation.jsx`:

```jsx
const response = await axios.post('http://localhost:3001/v1/navigate', {
  query,
  available_routes: AVAILABLE_ROUTES,
  model: 'gpt-4o-mini'  // Change model here
})
```

## Performance Metrics

- **Keyword matching**: < 10ms
- **AI routing**: 500-1500ms (depends on API response)
- **Total UX**: Smooth with loading indicator

## Support

For detailed information, see: [NLQ_NAVIGATION_GUIDE.md](./NLQ_NAVIGATION_GUIDE.md)

---

**Enjoy intelligent navigation!** 🚀
