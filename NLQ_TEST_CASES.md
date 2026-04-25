# NLQ Navigation Feature - Test Cases

## Unit Tests

### Test Case 1: Keyword Matching
**Description**: Test fallback keyword matching when AI service fails
**Input**: Query "users"
**Expected Output**: Route `/admin/users`
**Status**: ✓ Ready to test

### Test Case 2: AI-Powered Navigation
**Description**: Test AI service responds with correct route
**Input**: Query "Go to dashboard"
**Expected Output**: Route `/admin/dashboard` with confidence > 0.5
**Status**: ✓ Ready to test

### Test Case 3: Typo Tolerance
**Description**: Test keyword matching with slight typos
**Input**: Query "usrs" (typo)
**Expected Output**: Falls back gracefully or matches "users"
**Status**: ✓ Ready to test

### Test Case 4: Empty Query
**Description**: Test error handling for empty input
**Input**: Empty string
**Expected Output**: Error message "Query cannot be empty"
**Status**: ✓ Ready to test

### Test Case 5: Unknown Query
**Description**: Test handling of queries that don't match any route
**Input**: Query "xyz123"
**Expected Output**: Error message "Could not determine navigation target"
**Status**: ✓ Ready to test

## Integration Tests

### Test Case 6: API Endpoint Response
**Description**: Test `/v1/navigate` endpoint response format
**Command**: 
```bash
curl -X POST http://localhost:3001/v1/navigate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Go to users",
    "available_routes": [
      {"path": "/admin/users", "label": "Users", "keywords": ["users"]},
      {"path": "/admin/dashboard", "label": "Dashboard", "keywords": ["dashboard"]}
    ]
  }'
```
**Expected Output**: 
```json
{
  "route": "/admin/users",
  "confidence": 0.95,
  "reasoning": "User query matches users management page"
}
```
**Status**: ✓ Ready to test

### Test Case 7: Frontend to Backend Communication
**Description**: Test NLQSearchBar component sends request to backend
**Steps**:
1. Open admin panel
2. Type "Go to users" in search bar
3. Click search button or press Enter
4. Check Network tab in DevTools
**Expected**: POST request to `http://localhost:3001/v1/navigate`
**Status**: ✓ Ready to test

### Test Case 8: React Router Navigation
**Description**: Test React Router navigates correctly after response
**Steps**:
1. Type "Go to settings"
2. Verify URL changes to `/admin/settings`
3. Verify page content changes
**Expected**: Page updates to show settings
**Status**: ✓ Ready to test

## Performance Tests

### Test Case 9: Search Performance
**Description**: Measure response time for search queries
**Target**: < 2 seconds for AI-powered, < 50ms for keyword matching
**Measurement**: Open DevTools Network tab, note Total time
**Status**: ✓ Ready to test

### Test Case 10: Multiple Rapid Queries
**Description**: Test system handles multiple searches quickly
**Steps**:
1. Type "dashboard"
2. Navigate
3. Type "users"
4. Navigate
5. Type "settings"
6. Navigate
**Expected**: No errors or hangs
**Status**: ✓ Ready to test

## Browser Compatibility Tests

### Test Case 11: Chrome
**Status**: ✓ Ready to test

### Test Case 12: Firefox
**Status**: ✓ Ready to test

### Test Case 13: Safari
**Status**: ✓ Ready to test

### Test Case 14: Edge
**Status**: ✓ Ready to test

## Error Handling Tests

### Test Case 15: AI Service Offline
**Description**: Test system works when AI service is down
**Steps**:
1. Stop AI service
2. Try search query
3. Verify fallback keyword matching works
**Expected**: Navigation succeeds via keyword matching
**Status**: ✓ Ready to test

### Test Case 16: Network Error
**Description**: Test handling of network errors
**Steps**:
1. Disconnect internet
2. Try search query
3. Check error message
**Expected**: Friendly error message shown
**Status**: ✓ Ready to test

### Test Case 17: Timeout Handling
**Description**: Test handling of slow/timeout responses
**Steps**:
1. Set axios timeout to 1 second
2. Try search
3. Should timeout gracefully
**Expected**: Falls back to keyword matching
**Status**: ✓ Ready to test

## UX Tests

### Test Case 18: Search Bar Visibility
**Description**: Verify search bar is visible in topbar
**Steps**:
1. Open admin panel
2. Look at top navigation
**Expected**: Search bar visible between logo and user profile
**Status**: ✓ Ready to test

### Test Case 19: Suggestions Display
**Description**: Test auto-complete suggestions appear
**Steps**:
1. Click search bar
2. Type "proj"
3. Verify suggestions appear
**Expected**: Shows "Projects" as suggestion
**Status**: ✓ Ready to test

### Test Case 20: Loading Indicator
**Description**: Test loading state during search
**Steps**:
1. Type "Go to dashboard"
2. Hit Enter quickly
3. Watch search button
**Expected**: Shows ⏳ icon during processing
**Status**: ✓ Ready to test

### Test Case 21: Keyboard Navigation
**Description**: Test keyboard accessibility
**Steps**:
1. Press Tab to focus search bar
2. Type query
3. Press Enter to search
**Expected**: Navigation works with keyboard only
**Status**: ✓ Ready to test

### Test Case 22: Mobile Responsiveness
**Description**: Test on mobile devices
**Device**: iPhone/Android
**Expected**: Search bar responsive and functional
**Status**: ✓ Ready to test

## Running the Tests

### Setup

```bash
# Terminal 1: Start AI Service
cd Nexora/ai-service
python main.py

# Terminal 2: Start Admin Manager
cd Nexora/admin-manager
npm run dev

# Terminal 3: (Optional) Run API tests
# Use curl or Postman for API tests
```

### Quick Test Checklist

- [ ] Search bar visible in topbar
- [ ] Can type in search bar
- [ ] Can submit search (Enter or button)
- [ ] Suggestions appear while typing
- [ ] Loading indicator shows during search
- [ ] Navigation works for "dashboard"
- [ ] Navigation works for "users"
- [ ] Navigation works for "settings"
- [ ] Error message shown for unknown queries
- [ ] System works when AI service is down

### Test Results Template

```
Feature: NLQ Navigation
Date: [DATE]
Tester: [NAME]

Results:
- [ ] Search bar displays correctly
- [ ] AI navigation works
- [ ] Keyword fallback works
- [ ] Error handling works
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Accessibility okay

Issues Found:
1. [Issue description]
2. [Issue description]

Notes:
[Any additional observations]
```

## Test Data

### Positive Test Cases

| Query | Expected Route | Confidence |
|-------|-----------------|-----------|
| "Go to dashboard" | `/admin/dashboard` | 0.95+ |
| "Show users" | `/admin/users` | 0.95+ |
| "Navigate to settings" | `/admin/settings` | 0.95+ |
| "Go to projects" | `/admin/projects` | 0.90+ |
| "Show my profile" | `/admin/profile` | 0.90+ |
| "Access control" | `/admin/access` | 0.85+ |
| "AI" | `/admin/ai` | 0.85+ |

### Negative Test Cases

| Query | Expected Result |
|-------|-----------------|
| "" | Error: "Query cannot be empty" |
| "xyz123blah" | Error: "Could not determine navigation target" |
| "12345" | Error: "Could not determine navigation target" |
| "aaabbbccc" | Error: "Could not determine navigation target" |

## Performance Baselines

- Keyword matching: 5-20ms
- AI routing: 500-1500ms
- Total UX: 1500-2000ms max
- Search bar render: < 100ms

---

Run tests sequentially and document results for QA purposes.
