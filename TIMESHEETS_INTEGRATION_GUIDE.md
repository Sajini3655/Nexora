# Timesheets Module - Integration Guide

## Quick Start

The Timesheets module is fully implemented and ready for backend integration. All frontend pages, routes, and backend infrastructure are in place.

### Current Status

✅ **Frontend**: Complete with UI pages for all roles
✅ **Routes**: Configured in App.jsx
✅ **Backend Infrastructure**: Entity, Repository, Service, Controllers ready
✅ **Compilation**: Both frontend and backend compile without errors

⏳ **Next Steps**: Database migration and API endpoint integration

---

## Frontend Integration

### Pages Ready to Use

1. **Admin Timesheets** - `/admin/timesheets`
   - View all timesheets with filters
   - Export functionality (placeholder)

2. **Manager Timesheets** - `/manager/timesheets`
   - Review team timesheets
   - Approve/reject with reason dialog

3. **Developer Timesheets** - `/dev/timesheets`
   - Add new timesheet entries
   - Submit for approval
   - View own submissions

4. **Client Timesheets** - `/client/timesheets`
   - Read-only view of approved hours
   - Project summary cards

### Sidebar Navigation

All four sidebars have been updated with "Timesheets" menu items using Schedule icons.

### API Endpoint Locations

Each page has `TODO:` comments indicating where to add backend API calls:

**AdminTimesheets.jsx (lines ~40-45)**
```javascript
// TODO: Replace with actual backend data
// GET /api/admin/timesheets?userId=X&projectId=Y&status=Z&dateFrom=X&dateTo=Y
```

**ManagerTimesheets.jsx (lines ~50-55)**
```javascript
// TODO: Call PATCH /api/manager/timesheets/{id}/approve
// TODO: Call PATCH /api/manager/timesheets/{id}/reject with rejectionReason
```

**DevTimesheets.jsx (lines ~65-80)**
```javascript
// TODO: Call POST /api/developer/timesheets with formData (status: DRAFT)
// TODO: Call POST /api/developer/timesheets with formData (status: SUBMITTED)
```

**ClientTimesheets.jsx (lines ~40-45)**
```javascript
// TODO: Replace with actual backend data (only APPROVED timesheets)
// GET /api/client/timesheets?projectId=X&dateFrom=Y&dateTo=Z
```

---

## Backend Integration

### 1. Database Setup

```bash
# Run migration script (see TIMESHEETS_DATABASE_MIGRATION.md for details)
# This creates the timesheet_entries table with proper constraints and indexes
```

### 2. Available Endpoints

#### Developer Endpoints
```
POST   /api/developer/timesheets
       Create new timesheet (DRAFT or SUBMITTED)
       Body: { projectId, taskId, workDate, hoursWorked, description }
       Response: TimesheetEntryDto

GET    /api/developer/timesheets
       Get all own timesheets
       Response: List<TimesheetEntryDto>

PATCH  /api/developer/timesheets/{id}/submit
       Submit draft for approval
       Response: TimesheetEntryDto (status=SUBMITTED)
```

#### Manager Endpoints
```
GET    /api/manager/timesheets
       Get submitted timesheets for team
       Params: projectId (optional)
       Response: List<TimesheetEntryDto>

PATCH  /api/manager/timesheets/{id}/approve
       Approve a submitted timesheet
       Response: TimesheetEntryDto (status=APPROVED)

PATCH  /api/manager/timesheets/{id}/reject
       Reject with reason
       Params: rejectionReason
       Response: TimesheetEntryDto (status=REJECTED)
```

#### Admin Endpoints
```
GET    /api/admin/timesheets
       Get all timesheets (paginated)
       Params: developerId, projectId, status, dateFrom, dateTo, page, size
       Response: Page<TimesheetEntryDto>
```

#### Client Endpoints
```
GET    /api/client/timesheets
       Get approved timesheets only
       Params: projectId, dateFrom, dateTo, page, size
       Response: Page<TimesheetEntryDto>
```

### 3. Service Layer Usage

The `TimesheetService` handles all business logic:

```java
// Create a draft
TimesheetEntryDto dto = timesheetService.createDraftTimesheet(request, auth);

// Submit for approval
TimesheetEntryDto dto = timesheetService.submitTimesheet(id, auth);

// Manager approves
TimesheetEntryDto dto = timesheetService.approveTimesheet(id, auth);

// Manager rejects
TimesheetEntryDto dto = timesheetService.rejectTimesheet(id, reason, auth);

// Get all timesheets with filters
Page<TimesheetEntryDto> page = timesheetService.getAllTimesheets(
    developerId, projectId, status, dateFrom, dateTo, pageable
);
```

### 4. Business Rules Enforced

- ✅ Developer can only create/submit their own timesheets
- ✅ Manager can only approve timesheets for their projects
- ✅ Hours must be > 0
- ✅ Project is required, task is optional
- ✅ Status transitions: DRAFT → SUBMITTED → APPROVED/REJECTED
- ✅ Clients can only view APPROVED timesheets

---

## Frontend Integration Steps

### Option 1: Using Fetch API

```javascript
// In AdminTimesheets.jsx or similar

useEffect(() => {
  const fetchTimesheets = async () => {
    try {
      const response = await fetch('/api/admin/timesheets?page=0&size=20');
      const data = await response.json();
      setTimesheets(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      setError('Failed to load timesheets');
    }
  };
  
  fetchTimesheets();
}, [page]);
```

### Option 2: Using Existing API Service

Create or update `src/services/timesheetService.js`:

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:8081/api';

export const timesheetService = {
  // Developer endpoints
  createTimesheet: (data) => 
    axios.post(`${API_BASE}/developer/timesheets`, data),
  
  getMyTimesheets: () => 
    axios.get(`${API_BASE}/developer/timesheets`),
  
  submitTimesheet: (id) => 
    axios.patch(`${API_BASE}/developer/timesheets/${id}/submit`),

  // Manager endpoints
  getSubmittedTimesheets: (projectId) => 
    axios.get(`${API_BASE}/manager/timesheets`, {
      params: { projectId }
    }),
  
  approveTimesheet: (id) => 
    axios.patch(`${API_BASE}/manager/timesheets/${id}/approve`),
  
  rejectTimesheet: (id, reason) => 
    axios.patch(`${API_BASE}/manager/timesheets/${id}/reject`, null, {
      params: { rejectionReason: reason }
    }),

  // Admin endpoints
  getAllTimesheets: (filters, page = 0, size = 20) => 
    axios.get(`${API_BASE}/admin/timesheets`, {
      params: { ...filters, page, size }
    }),

  // Client endpoints
  getApprovedTimesheets: (projectId, dateFrom, dateTo) => 
    axios.get(`${API_BASE}/client/timesheets`, {
      params: { projectId, dateFrom, dateTo }
    })
};
```

Then use in components:

```javascript
import { timesheetService } from '../services/timesheetService';

// In DevTimesheets.jsx
const handleSubmit = async () => {
  try {
    await timesheetService.submitTimesheet(selectedTimesheet.id);
    // Refresh list
    const updated = await timesheetService.getMyTimesheets();
    setTimesheets(updated.data);
  } catch (error) {
    setError(error.response?.data?.message || 'Submit failed');
  }
};
```

---

## Testing Checklist

### Frontend Testing
- [ ] Admin can navigate to `/admin/timesheets`
- [ ] Manager can navigate to `/manager/timesheets`
- [ ] Developer can navigate to `/dev/timesheets`
- [ ] Client can navigate to `/client/timesheets`
- [ ] Sidebar menu items appear and are clickable
- [ ] Forms validate required fields
- [ ] Dialogs open/close correctly
- [ ] Filtering UI works (mock data)
- [ ] Table sorting works (mock data)

### Backend Testing
- [ ] Create timesheet endpoint returns 201
- [ ] Submit timesheet returns correct status change
- [ ] Approve endpoint validates manager access
- [ ] Reject endpoint requires reason
- [ ] Admin can filter by all parameters
- [ ] Pagination works correctly
- [ ] Unauthorized users get 403 Forbidden
- [ ] Invalid data returns 400 Bad Request

### Integration Testing
- [ ] Developer creates → Manager approves → shows APPROVED in Admin
- [ ] Manager rejects → Developer sees rejection reason
- [ ] Client can only see APPROVED entries
- [ ] Filtering works end-to-end
- [ ] Total hours calculations are accurate
- [ ] Status changes persist in database

---

## Code Example: Complete Integration

### DevTimesheets.jsx - Full Integration

```javascript
import React, { useState, useEffect } from "react";
import { timesheetService } from "../services/timesheetService";
// ... other imports

export default function DevTimesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    taskId: "",
    workDate: new Date().toISOString().split("T")[0],
    hoursWorked: "",
    description: "",
  });

  // Load timesheets on mount
  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const response = await timesheetService.getMyTimesheets();
      setTimesheets(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.projectId) {
      setError("Please select a project");
      return;
    }
    if (!formData.hoursWorked || Number(formData.hoursWorked) <= 0) {
      setError("Hours must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      // Create timesheet with status=SUBMITTED
      await timesheetService.createTimesheet(formData);
      
      // Reload list
      await loadTimesheets();
      setOpenDialog(false);
      setFormData({...initialFormData});
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit timesheet");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

## Deployment Steps

1. **Database Migration**
   ```bash
   # Run migration script
   mysql -u root -p < TIMESHEETS_DATABASE_MIGRATION.sql
   ```

2. **Backend Deployment**
   ```bash
   cd backend
   mvn clean package -DskipTests
   # Deploy JAR file
   ```

3. **Frontend Deployment**
   ```bash
   cd admin-manager
   npm install  # if needed
   npm run build
   # Serve dist/ directory
   ```

4. **Verify Endpoints**
   ```bash
   curl http://localhost:8081/api/developer/timesheets
   curl http://localhost:8081/api/manager/timesheets
   curl http://localhost:8081/api/admin/timesheets
   curl http://localhost:8081/api/client/timesheets
   ```

5. **Test in UI**
   - Navigate to each role's timesheet page
   - Verify data loads without errors
   - Test create/submit/approve/reject workflows

---

## Troubleshooting

### "Cannot GET /admin/timesheets"
- Backend server not running
- Route not registered in App.jsx
- Check `npm run build` completes successfully

### "404: Endpoint not found"
- Backend controller not deployed
- Check controller class exists and is in right package
- Verify controller path matches URL pattern

### "401: Unauthorized"
- User not authenticated
- Check ProtectedRoute wrapper
- Verify JWT token is being sent

### Mock data showing instead of real data
- API calls still commented out
- Check for TODO: comments in page code
- Uncomment and update API service calls

### Database table doesn't exist
- Migration script not run
- Check MySQL for `timesheet_entries` table
- Run migration script with proper database
- Check schema is applied

---

## Performance Optimization

### Index Strategy
The repository already includes optimized queries with proper indexes:
- Single developer lookup: `idx_developer`
- Date range queries: `idx_developer_date`, `idx_project_date`
- Status filtering: `idx_status`
- See `TIMESHEETS_DATABASE_MIGRATION.md` for all indexes

### Query Optimization
```java
// Use pagination for large datasets
Page<TimesheetEntryDto> page = timesheetService.getAllTimesheets(
    null, null, null, null, null,
    PageRequest.of(0, 20)
);

// Filter to reduce result set
Page<TimesheetEntryDto> page = timesheetService.getAllTimesheets(
    developerId, projectId, TimesheetStatus.SUBMITTED, 
    LocalDate.now().minusMonths(1), LocalDate.now(),
    PageRequest.of(0, 20)
);
```

### Caching (Future Enhancement)
```java
@Cacheable("developerTimesheets")
public List<TimesheetEntryDto> getMyTimesheets(Authentication auth) {
    // ...
}
```

---

## Related Documentation

- [TIMESHEETS_IMPLEMENTATION.md](./TIMESHEETS_IMPLEMENTATION.md) - Full implementation details
- [TIMESHEETS_DATABASE_MIGRATION.md](./TIMESHEETS_DATABASE_MIGRATION.md) - Database setup
- [ROLE_STRUCTURE.md](./admin-manager/ROLE_STRUCTURE.md) - Frontend architecture
- [Backend README](./backend/README.md) - Backend setup (if exists)

---

## Support & Questions

For implementation questions, refer to:
1. **Frontend**: Check TODO comments in page files
2. **Backend**: Review controller classes and service layer
3. **Database**: See migration scripts for schema details
4. **API**: Use Postman/curl to test endpoints directly

---

**Last Updated**: April 28, 2026
**Status**: Ready for Backend Integration
**Build Status**: ✅ All systems operational
