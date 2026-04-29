# Chat Persistence Fix - Testing & Troubleshooting Guide

## Quick Start

### Step 1: Start Backend
```bash
cd backend
mvn spring-boot:run
```
Expected output: Server started on port 8081, WebSocket endpoint `/ws` available

### Step 2: Start Frontend
```bash
cd admin-manager
npm run dev
```
Expected output: Server started on http://localhost:5173 or 5174

### Step 3: Set Up Two Developer Sessions
- **Session A:** Chrome normal window - Login as Developer A
- **Session B:** Edge/Incognito - Login as Developer B
- Both navigate to: `http://localhost:5173/dev/projects/10` (or any project with both developers assigned)

---

## Test Case 1: Initial Session - Shared Visibility

### Steps
1. Developer A opens `/dev/projects/10`
2. Observe: Chat loads with "Project Chat" header
3. Developer B opens `/dev/projects/10` (different browser/incognito)
4. Observe: Chat loads in Dev B's window

### Expected Behavior
- Both show same "Project Chat" section
- Both have empty message list initially (or list of existing messages if session exists)
- No errors in browser console
- Both subscribe to WebSocket (check: Network tab should show WebSocket connection to `/ws`)

### What's Happening Behind the Scenes
```
Dev A: GET /api/chat/project/10 → Response: null (no session yet)
Dev A: POST /api/chat/start/10 → Creates ChatSession #100
Dev A: GET /api/chat/messages/100 → Response: [] (empty)
Dev A: WebSocket subscribe to /topic/projects/10/chat

Dev B: GET /api/chat/project/10 → Response: {id: 100, ...} (finds Dev A's session)
Dev B: Skip startSession (reuses session #100)
Dev B: GET /api/chat/messages/100 → Response: [] (same session)
Dev B: WebSocket subscribe to /topic/projects/10/chat
```

### Verify
- Open Dev B browser console: F12 → No errors
- Open Dev A browser console: F12 → No errors
- In both: Look for "WebSocket" connection in Network tab

---

## Test Case 2: Real-Time Message Sharing

### Steps
1. Both Dev A and Dev B viewing project 10 chat
2. Dev A types: "Hello from Developer A" and clicks Send
3. Watch Dev B's screen

### Expected Behavior
- Dev A: Message appears immediately after sending
- Dev B: Message appears immediately WITHOUT needing refresh
- Dev B's screen shows sender name: "Developer A" or actual name
- Message includes timestamp

### Data Flow
```
Dev A sends message:
  → ChatBox calls handleSend()
  → Appends to local state (for optimistic UI)
  → Publishes to /app/chat.send (WebSocket)
  → Backend: ChatSocketController.sendMessage()
  → Saves to DB: ChatMessage(session=100, sender=DevA, content="Hello...", createdAt=now)
  → Broadcasts to /topic/projects/10/chat (WebSocket)
  → Dev B receives message on /topic/projects/10/chat subscription
  → Deduplicates if needed (dev A already has from optimistic UI)
  → Both see message in chat window
```

### Verify
- Dev B receives message without page refresh ✓
- Timestamp shows correct time ✓
- Sender name is correct ✓

### If Message Doesn't Appear
1. Check network tab: Is WebSocket still connected?
   - Look for `/ws` connection in Network tab
   - Status should be "101 Switching Protocols" (WebSocket)
2. Check console for errors
3. Manually refresh Dev B page - message should appear from DB
4. Check backend logs for errors

---

## Test Case 3: Message Persistence - Refresh

### Steps
1. Dev A and B viewing project 10 with messages
2. Dev A types: "Testing persistence" and sends
3. Dev B refreshes page (Ctrl+R or Cmd+R)
4. Wait for chat to load

### Expected Behavior
- After refresh, Dev B still sees "Testing persistence"
- Message loaded from database, not from local state

### Data Flow
```
Dev B refreshes:
  → React component unmounts and remounts
  → ChatBox.tsx useEffect triggers
  → Calls getProjectSession(10)
  → Gets sessionId 100 (same session as before)
  → Calls getMessages(100)
  → Backend queries: SELECT * FROM chat_message WHERE session_id=100 ORDER BY created_at ASC
  → Returns all messages including "Testing persistence"
  → Frontend displays all messages
```

### Verify
- Message visible after refresh ✓
- No "Loading..." indefinitely ✓
- WebSocket reconnects automatically ✓

### If Message Is Missing After Refresh
1. Check browser console for errors
2. Check network requests: Is `GET /api/chat/messages/100` returning data?
   - Network tab → XHR → look for `/chat/messages/...`
   - Should return 200 with array of messages
3. Check backend logs for SQL errors
4. Verify session ID is same: Log both responses from `getProjectSession`

---

## Test Case 4: Logout and Login - Persistence

### Steps
1. Dev B viewing project 10 with existing messages
2. Dev B clicks Logout button
3. Dev B logs back in
4. Dev B navigates to `/dev/projects/10`

### Expected Behavior
- Chat loads with all previous messages
- Can continue conversation
- No message loss

### Data Flow
```
After Dev B logout/login:
  → Token changes, but database persists
  → New ChatBox instance
  → getProjectSession(10) finds active session (same one)
  → getMessages loads from database
  → Messages displayed (all history maintained)
```

### Verify
- Message history visible after login ✓
- No messages deleted ✓
- Can send new messages ✓

### If Messages Missing After Login
1. Check: Is `projectId` correct in URL?
2. Check: Are you logging in with same or different user?
   - Same user: Should see all messages
   - Different user: If they're not assigned to project, access denied
3. Check browser console
4. Check network tab: What does `getProjectSession(10)` return?

---

## Test Case 5: Logout and Different User - Isolation

### Steps
1. Dev A sends message in project 10: "Secret message for Dev A"
2. Dev A logs out
3. Developer C logs in (not assigned to project 10, or different project)
4. Dev C tries to access `/dev/projects/10`

### Expected Behavior
- Dev C either: Cannot see project 10 (correct - not assigned)
- Or can see project 10 but cannot access chat (access denied)
- Dev A's message NOT visible to Dev C

### What's Happening
- Backend enforces access control in `ensureCanAccessProject()`
- Only users assigned to project can see/load chat messages

### Verify
- Dev C cannot access chat messages ✓
- Backend returns 403 Forbidden or similar ✓

---

## Test Case 6: Project Isolation

### Steps
1. Dev A and B in project 10, send "Message for project 10"
2. Dev A opens `/dev/projects/11` (different project)
3. Observe Dev A's project 11 chat

### Expected Behavior
- Dev A sees different chat for project 11
- Does NOT see "Message for project 10"
- Project 11 has different message thread

### Data Flow
```
Dev A opens project 11:
  → ChatBox initialization with projectId=11
  → getProjectSession(11) searches for session where project_id=11
  → Different ChatSession (different session ID)
  → getMessages loads messages only for project 11 session
  → WebSocket subscribes to /topic/projects/11/chat (different topic)
```

### Verify
- Project 11 chat is separate ✓
- Messages from project 10 not visible ✓

### If Messages Leak Across Projects
1. Check: Is `projectId` being passed correctly to ChatBox?
2. Check: Are session queries filtering by projectId correctly?
   - Query should be: `findFirstByProject_IdAndEndedFalseOrderByStartedAtDesc(projectId)`
   - NOT: `findFirstByEndedFalseOrderByStartedAtDesc()` (missing projectId filter)

---

## Test Case 7: Sequential Sessions

### Steps
1. Dev A and B in project 10, chat about something
2. Click "End" button
3. Chat summary appears, input disabled
4. One of them tries to send a new message
5. Clicks "End" → new session starts or prompt to start new

### Expected Behavior
- Old session marked as `ended=true`
- New session can be created
- New session has empty message list (or new chat starts)
- Old messages still visible but read-only

### Verify
- Input disabled after clicking "End" ✓
- Summary shown ✓
- Can start new conversation afterward ✓

---

## Troubleshooting Guide

### Issue: "Chat session was not created"
**Cause:** Backend failed to create session  
**Check:**
1. Backend logs: `mvn spring-boot:run` output
2. Does project exist? Check DB: `SELECT * FROM project WHERE id=10;`
3. Is user authenticated? Check: `Authorization: Bearer <token>` header

**Fix:**
- Restart backend
- Verify project ID exists
- Check JWT token is valid

---

### Issue: Different developers see different messages
**Cause:** Multiple sessions created for same project  
**Check:**
1. Both developers' network requests:
   - Dev A: `GET /api/chat/project/10` → should return sessionId X
   - Dev B: `GET /api/chat/project/10` → should return same sessionId X
2. Database: `SELECT id, project_id, ended FROM chat_session WHERE project_id=10;`
   - Should see ONE row with ended=false
   - If multiple rows with ended=false → race condition happened

**Fix:**
- Check backend logs for race conditions
- Manually end extra sessions in DB: `UPDATE chat_session SET ended=true WHERE id=X;`
- Restart both developers' chats

---

### Issue: Messages disappear after refresh
**Cause:** Not loading from database  
**Check:**
1. Network tab: Is `GET /api/chat/messages/{sessionId}` returning 200?
2. Response contains message array?
3. Backend database: `SELECT * FROM chat_message WHERE session_id=X;`

**Fix:**
- Check backend logs for errors
- Verify database connection
- Check user has permission to read messages

---

### Issue: WebSocket not working (real-time messages not appearing)
**Cause:** WebSocket connection not established  
**Check:**
1. Browser Network tab: Is there a `/ws` connection?
   - Status should be "101 Switching Protocols"
   - If not, WebSocket failed to upgrade
2. Browser console: Any WebSocket errors?
3. Backend logs: Any "WebSocket" errors?

**Fix:**
```bash
# Restart backend
mvn spring-boot:run

# Restart frontend
npm run dev

# Check firewall blocking port 8081
```

---

### Issue: "Access Denied" when loading messages
**Cause:** User not assigned to project  
**Check:**
1. Is current user actually assigned to project 10?
2. Check DB: `SELECT * FROM task WHERE project_id=10 AND assigned_to_id=<userId>;`
3. Or: `SELECT manager_id FROM project WHERE id=10;` (is user the manager?)

**Fix:**
- Log in as correct user assigned to project
- Or have manager assign you to project

---

### Issue: Backend won't start
**Error:** `ClassNotFoundException: com.admin.dto.RegisterRequest`  
**Fix:**
```bash
cd backend
mvn clean compile
# Check if RegisterRequest.java exists in dto/ folder
# If not, find where it's used and remove references
# Or create a stub RegisterRequest class
```

---

## Advanced Debugging

### Check Database Schema
```sql
-- Connect to Supabase database
-- Run these queries:

SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA='public' AND TABLE_NAME LIKE 'chat%';

SELECT * FROM chat_session WHERE project_id=10 AND ended=false;

SELECT id, session_id, sender_id, content, created_at FROM chat_message 
WHERE session_id IN (SELECT id FROM chat_session WHERE project_id=10)
ORDER BY created_at DESC;
```

### Monitor WebSocket Messages
1. Browser DevTools → Network tab
2. Filter: "ws" (WebSocket)
3. Click `/ws` connection
4. Messages tab: See incoming/outgoing WebSocket frames
5. Outgoing should have: `@MESSAGE` with `/topic/projects/10/chat`

### Check Spring Logs
```bash
# Run with verbose logging
cd backend
mvn spring-boot:run -Dlogging.level.root=DEBUG
```

---

## When Tests Pass ✓

If all test cases pass:
1. Chat persistence is working ✓
2. Shared visibility is working ✓
3. Real-time synchronization is working ✓
4. Database storage is working ✓
5. Access control is working ✓
6. Project isolation is working ✓
7. Sequential sessions are working ✓

Congratulations! The chat system is now fully functional for multi-developer collaboration per project.
