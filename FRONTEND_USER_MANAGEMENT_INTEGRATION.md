# 🎨 FRONTEND INTEGRATION GUIDE - USER MANAGEMENT

> **Dokumentasi Lengkap untuk Frontend Developer**  
> Panduan cara mengambil dan mengelola data User dari Backend TPMS

---

## 📚 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Authentication Setup](#authentication-setup)
3. [API Endpoints Overview](#api-endpoints-overview)
4. [Frontend Workflow](#frontend-workflow)
5. [Code Examples](#code-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 QUICK START

### Base URL
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
// Production: https://your-domain.com/api
```

### Required Headers
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

### Authentication Flow
```
1. User Login → Get JWT Token
2. Store Token (localStorage/sessionStorage)
3. Include Token in all requests
4. Handle 401 (Unauthorized) → Redirect to Login
```

---

## 🔐 AUTHENTICATION SETUP

### Step 1: Login & Get Token

**Endpoint:** `POST /api/auth/login`

```javascript
// Login Function
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Usage
await login('admin@tpms.com', 'admin123');
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "superadmin"
  }
}
```

### Step 2: Create Axios Instance (Recommended)

```javascript
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📋 API ENDPOINTS OVERVIEW

### 👤 Profile Management (All Users)

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | All |
| PUT | `/users/me` | Update profile | All |
| PATCH | `/users/me/password` | Change password | All |
| POST | `/users/me/avatar` | Upload avatar | All |
| DELETE | `/users/me/avatar` | Delete avatar | All |
| PATCH | `/users/me/two-factor` | Toggle 2FA | All |

### 👥 User Management (Admin Only)

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get all users (paginated) | Admin/Superadmin |
| GET | `/users/:id` | Get user by ID | Admin/Superadmin |
| POST | `/users` | Create new user | Admin/Superadmin |
| PUT | `/users/:id` | Update user | Admin/Superadmin |
| PATCH | `/users/:id/status` | Update user status | Admin/Superadmin |
| DELETE | `/users/:id` | Delete user (soft delete) | Admin/Superadmin |

---

## 🔄 FRONTEND WORKFLOW

### Workflow 1: Display User Profile Page

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND WORKFLOW: Get & Display User Profile              │
└─────────────────────────────────────────────────────────────┘

1. USER ACCESS PROFILE PAGE
   ↓
2. COMPONENT MOUNT (useEffect/componentDidMount)
   ↓
3. CALL API: GET /api/users/me
   ↓
4. BACKEND PROCESS:
   - Verify JWT token
   - Get user from database
   - Return user data
   ↓
5. FRONTEND RECEIVE DATA
   ↓
6. UPDATE STATE (useState/setState)
   ↓
7. RENDER UI WITH DATA
```

**React Example:**

```javascript
import React, { useState, useEffect } from 'react';
import api from './services/api'; // axios instance

function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // STEP 2-7: Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // STEP 3: Call API
      const response = await api.get('/users/me');
      
      // STEP 5-6: Receive data & update state
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 7: Render UI
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <div className="profile-info">
        <p><strong>Name:</strong> {profile?.name}</p>
        <p><strong>Email:</strong> {profile?.email}</p>
        <p><strong>Role:</strong> {profile?.role}</p>
        <p><strong>Phone:</strong> {profile?.phone || '-'}</p>
        <p><strong>Department:</strong> {profile?.department || '-'}</p>
        <p><strong>Bio:</strong> {profile?.bio || '-'}</p>
      </div>
    </div>
  );
}
```

### Workflow 2: Update User Profile

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND WORKFLOW: Update User Profile                     │
└─────────────────────────────────────────────────────────────┘

1. USER EDIT FORM FIELDS
   ↓
2. USER CLICK "SAVE" BUTTON
   ↓
3. VALIDATE INPUT (Frontend)
   - Check required fields
   - Validate email format
   - Check phone format
   ↓
4. CALL API: PUT /api/users/me
   - Send: { firstName, lastName, phone, department, bio }
   ↓
5. BACKEND PROCESS:
   - Verify JWT token
   - Validate data
   - Update database
   - Return updated user
   ↓
6. FRONTEND RECEIVE RESPONSE
   ↓
7. UPDATE STATE WITH NEW DATA
   ↓
8. SHOW SUCCESS MESSAGE
   ↓
9. REFRESH UI
```

**React Example:**

```javascript
import React, { useState } from 'react';
import api from './services/api';

function EditProfile({ currentProfile, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: currentProfile?.firstName || '',
    lastName: currentProfile?.lastName || '',
    phone: currentProfile?.phone || '',
    department: currentProfile?.department || '',
    bio: currentProfile?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // STEP 1: Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // STEP 2-9: Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // STEP 3: Frontend validation
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // STEP 4: Call API
      const response = await api.put('/users/me', formData);

      // STEP 6-7: Receive response & update state
      if (response.data.success) {
        // STEP 8: Show success message
        alert('Profile updated successfully!');
        
        // STEP 9: Trigger parent component refresh
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>First Name:</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Last Name:</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Phone:</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+62812345678"
        />
      </div>

      <div>
        <label>Department:</label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Bio:</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows="4"
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

### Workflow 3: Get All Users (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND WORKFLOW: List All Users with Pagination          │
└─────────────────────────────────────────────────────────────┘

1. USER ACCESS USER MANAGEMENT PAGE
   ↓
2. COMPONENT MOUNT
   ↓
3. CALL API: GET /api/users?page=1&limit=10&search=&role=&status=
   ↓
4. BACKEND PROCESS:
   - Verify JWT token
   - Check admin role
   - Query database with filters
   - Return paginated results
   ↓
5. FRONTEND RECEIVE DATA:
   {
     data: [...users],
     pagination: { page, limit, total, totalPages }
   }
   ↓
6. UPDATE STATE
   ↓
7. RENDER TABLE/CARDS
   ↓
8. USER INTERACT:
   - Change page
   - Search
   - Filter by role/status
   ↓
9. REPEAT STEP 3-7 with new params
```

**React Example with Pagination:**

```javascript
import React, { useState, useEffect } from 'react';
import api from './services/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch users when page or filters change
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // STEP 3: Build query params
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status })
      });

      // Call API
      const response = await api.get(`/users?${params}`);

      // STEP 5-6: Update state
      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 8: Handle pagination
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Handle search
  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
    setPagination({ ...pagination, page: 1 }); // Reset to page 1
  };

  // Handle role filter
  const handleRoleFilter = (e) => {
    setFilters({ ...filters, role: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="user-management">
      <h1>User Management</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={handleSearch}
        />

        <select value={filters.role} onChange={handleRoleFilter}>
          <option value="">All Roles</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
          <option value="operator">Operator</option>
          <option value="viewer">Viewer</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.phone || '-'}</td>
                  <td>{user.department || '-'}</td>
                  <td>{user.status}</td>
                  <td>
                    <button onClick={() => handleEdit(user.id)}>Edit</button>
                    <button onClick={() => handleDelete(user.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages} 
              (Total: {pagination.total} users)
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### Workflow 4: Create New User (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND WORKFLOW: Create New User                         │
└─────────────────────────────────────────────────────────────┘

1. ADMIN CLICK "CREATE USER" BUTTON
   ↓
2. SHOW CREATE USER FORM/MODAL
   ↓
3. ADMIN FILL FORM:
   - firstName, lastName
   - email, password
   - role (dropdown)
   - phone, department, bio (optional)
   ↓
4. ADMIN CLICK "SAVE"
   ↓
5. VALIDATE INPUT (Frontend)
   ↓
6. CALL API: POST /api/users
   ↓
7. BACKEND PROCESS:
   - Verify admin token
   - Check role permissions
   - Validate email uniqueness
   - Hash password
   - Create user in database
   ↓
8. FRONTEND RECEIVE RESPONSE
   ↓
9. SUCCESS:
   - Close form/modal
   - Refresh user list
   - Show success message
   ↓
10. ERROR:
    - Show error message
    - Keep form open
```

**React Example:**

```javascript
import React, { useState } from 'react';
import api from './services/api';

function CreateUserModal({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'operator',
    phone: '',
    department: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // STEP 5: Frontend validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('All required fields must be filled');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // STEP 6: Call API
      const response = await api.post('/users', formData);

      // STEP 8-9: Success
      if (response.data.success) {
        alert('User created successfully!');
        onUserCreated(response.data.data); // Refresh parent list
        onClose(); // Close modal
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'operator',
          phone: '',
          department: '',
          bio: ''
        });
      }
    } catch (err) {
      // STEP 10: Error
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create New User</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div>
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
              {/* Only superadmin can create admin */}
              {/* <option value="admin">Admin</option> */}
            </select>
          </div>

          <div>
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+62812345678"
            />
          </div>

          <div>
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Workflow 5: Upload Avatar

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND WORKFLOW: Upload Avatar Image                     │
└─────────────────────────────────────────────────────────────┘

1. USER CLICK "UPLOAD AVATAR" or "CHANGE PHOTO"
   ↓
2. FILE INPUT TRIGGERED
   ↓
3. USER SELECT IMAGE FILE
   ↓
4. FRONTEND VALIDATION:
   - Check file type (jpg, png, gif, webp)
   - Check file size (max 5MB)
   - Preview image (optional)
   ↓
5. CREATE FormData OBJECT
   ↓
6. CALL API: POST /api/users/me/avatar
   - Content-Type: multipart/form-data
   - Body: FormData with file
   ↓
7. BACKEND PROCESS:
   - Verify JWT token
   - Multer middleware handles upload
   - Save to /uploads/avatars/
   - Update database with path
   - Delete old avatar file
   ↓
8. FRONTEND RECEIVE RESPONSE:
   { avatar: "/uploads/avatars/avatar-1-123456.jpg" }
   ↓
9. UPDATE STATE & UI
   ↓
10. DISPLAY NEW AVATAR
```

**React Example:**

```javascript
import React, { useState, useRef } from 'react';
import api from './services/api';

function AvatarUpload({ currentAvatar, onAvatarUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentAvatar);
  const fileInputRef = useRef(null);

  // STEP 3-4: Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    uploadAvatar(file);
  };

  // STEP 5-10: Upload avatar
  const uploadAvatar = async (file) => {
    try {
      setUploading(true);

      // STEP 5: Create FormData
      const formData = new FormData();
      formData.append('avatar', file);

      // STEP 6: Call API with multipart/form-data
      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // STEP 8-9: Update state
      if (response.data.success) {
        alert('Avatar uploaded successfully!');
        
        if (onAvatarUpdated) {
          onAvatarUpdated(response.data.data.avatar);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.message || 'Failed to upload avatar');
      
      // Restore old avatar on error
      setPreview(currentAvatar);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete avatar
  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return;

    try {
      setUploading(true);

      const response = await api.delete('/users/me/avatar');

      if (response.data.success) {
        setPreview(null);
        alert('Avatar deleted successfully!');
        
        if (onAvatarUpdated) {
          onAvatarUpdated(null);
        }
      }
    } catch (err) {
      alert('Failed to delete avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {preview ? (
          <img 
            src={preview.startsWith('data:') ? preview : `http://localhost:3001${preview}`} 
            alt="Avatar" 
            className="avatar-image"
          />
        ) : (
          <div className="avatar-placeholder">
            <span>No Avatar</span>
          </div>
        )}
      </div>

      <div className="avatar-actions">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : preview ? 'Change Avatar' : 'Upload Avatar'}
        </button>

        {preview && (
          <button
            onClick={handleDeleteAvatar}
            disabled={uploading}
            className="delete-btn"
          >
            Delete Avatar
          </button>
        )}
      </div>
    </div>
  );
}
```

### Workflow 6: Change Password

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND WORKFLOW: Change Password                         │
└─────────────────────────────────────────────────────────────┘

1. USER CLICK "CHANGE PASSWORD"
   ↓
2. SHOW PASSWORD FORM
   ↓
3. USER FILL:
   - Current Password
   - New Password
   - Confirm New Password
   ↓
4. FRONTEND VALIDATION:
   - Current password not empty
   - New password ≥ 6 characters
   - New password = Confirm password
   - New ≠ Current
   ↓
5. CALL API: PATCH /api/users/me/password
   ↓
6. BACKEND PROCESS:
   - Verify JWT token
   - Get user from database
   - Verify current password (bcrypt)
   - Hash new password
   - Update database
   ↓
7. FRONTEND RECEIVE RESPONSE
   ↓
8. SUCCESS:
   - Clear form
   - Show success message
   - Optional: Force re-login
   ↓
9. ERROR:
   - Show error (wrong password, etc)
   - Keep form open
```

**React Example:**

```javascript
import React, { useState } from 'react';
import api from './services/api';

function ChangePassword({ onPasswordChanged }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // STEP 4: Frontend validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // STEP 5: Call API
      const response = await api.patch('/users/me/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      // STEP 7-8: Success
      if (response.data.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        alert('Password changed successfully!');

        if (onPasswordChanged) {
          onPasswordChanged();
        }

        // Optional: Force re-login after 2 seconds
        // setTimeout(() => {
        //   localStorage.removeItem('token');
        //   window.location.href = '/login';
        // }, 2000);
      }
    } catch (err) {
      // STEP 9: Error
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password">
      <h2>Change Password</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength="6"
          />
          <small>Minimum 6 characters</small>
        </div>

        <div>
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">Password changed successfully!</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
```

---

## 📝 CODE EXAMPLES

### Complete Service Layer (Recommended Architecture)

```javascript
// src/services/userService.js

import api from './api'; // axios instance

class UserService {
  // Get current user profile
  async getMyProfile() {
    const response = await api.get('/users/me');
    return response.data;
  }

  // Update current user profile
  async updateMyProfile(data) {
    const response = await api.put('/users/me', data);
    return response.data;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await api.patch('/users/me/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  // Upload avatar
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Delete avatar
  async deleteAvatar() {
    const response = await api.delete('/users/me/avatar');
    return response.data;
  }

  // Toggle 2FA
  async toggleTwoFactor(enabled) {
    const response = await api.patch('/users/me/two-factor', { enabled });
    return response.data;
  }

  // Get all users (admin only)
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/users?${queryString}`);
    return response.data;
  }

  // Get user by ID (admin only)
  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }

  // Create user (admin only)
  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  }

  // Update user (admin only)
  async updateUser(userId, userData) {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  }

  // Update user status (admin only)
  async updateUserStatus(userId, status) {
    const response = await api.patch(`/users/${userId}/status`, { status });
    return response.data;
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
}

export default new UserService();
```

**Usage in Components:**

```javascript
import userService from './services/userService';

// In your component
const profile = await userService.getMyProfile();
await userService.updateMyProfile({ firstName: 'John', lastName: 'Doe' });
const users = await userService.getAllUsers({ page: 1, limit: 10 });
```

### React Context for User State (Global State Management)

```javascript
// src/context/UserContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import userService from '../services/userService';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await userService.getMyProfile();
        if (response.success) {
          setCurrentUser(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    const response = await userService.updateMyProfile(data);
    if (response.success) {
      setCurrentUser(response.data);
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const value = {
    currentUser,
    loading,
    updateProfile,
    logout,
    refreshUser: loadUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

**Usage:**

```javascript
// In App.js
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <YourApp />
    </UserProvider>
  );
}

// In any component
import { useUser } from './context/UserContext';

function ProfilePage() {
  const { currentUser, loading, updateProfile } = useUser();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {currentUser?.name}</h1>
      {/* ... */}
    </div>
  );
}
```

---

## ⚠️ ERROR HANDLING

### HTTP Status Codes

| Code | Meaning | Example | Frontend Action |
|------|---------|---------|-----------------|
| 200 | Success | Request successful | Update UI with data |
| 201 | Created | User created | Show success, refresh list |
| 400 | Bad Request | Missing required fields | Show error message |
| 401 | Unauthorized | Invalid/expired token | Redirect to login |
| 403 | Forbidden | Insufficient permissions | Show "Access Denied" |
| 404 | Not Found | User not found | Show "Not Found" |
| 409 | Conflict | Email already exists | Show error message |
| 500 | Server Error | Database error | Show "Server Error" |

### Error Response Format

```json
{
  "success": false,
  "message": "Email already exists"
}
```

### Complete Error Handling Example

```javascript
async function handleApiCall(apiFunction, successMessage) {
  try {
    const response = await apiFunction();
    
    if (response.success) {
      // Success
      if (successMessage) {
        showNotification(successMessage, 'success');
      }
      return response.data;
    } else {
      // API returned error
      showNotification(response.message, 'error');
      return null;
    }
  } catch (error) {
    // Network or other errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';

      switch (status) {
        case 400:
          showNotification(`Validation Error: ${message}`, 'error');
          break;
        case 401:
          showNotification('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          showNotification('You do not have permission to perform this action.', 'error');
          break;
        case 404:
          showNotification('Resource not found.', 'error');
          break;
        case 409:
          showNotification(`Conflict: ${message}`, 'error');
          break;
        case 500:
          showNotification('Server error. Please try again later.', 'error');
          break;
        default:
          showNotification(message, 'error');
      }
    } else if (error.request) {
      // Request made but no response
      showNotification('Network error. Please check your connection.', 'error');
    } else {
      // Something else went wrong
      showNotification(error.message, 'error');
    }
    
    console.error('API Error:', error);
    return null;
  }
}

// Usage
await handleApiCall(
  () => userService.createUser(userData),
  'User created successfully!'
);
```

---

## 🎯 BEST PRACTICES

### 1. Token Management

```javascript
// ✅ GOOD: Use interceptors
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ BAD: Manual token in every request
fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### 2. Loading States

```javascript
// ✅ GOOD: Show loading feedback
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await userService.getAllUsers();
    setUsers(data);
  } finally {
    setLoading(false); // Always in finally
  }
};

return loading ? <Spinner /> : <UserTable users={users} />;
```

### 3. Optimistic Updates

```javascript
// Update UI immediately, rollback on error
const handleUpdateStatus = async (userId, newStatus) => {
  // Save old state
  const oldUsers = [...users];
  
  // Update UI immediately
  setUsers(users.map(u => 
    u.id === userId ? { ...u, status: newStatus } : u
  ));

  try {
    await userService.updateUserStatus(userId, newStatus);
  } catch (error) {
    // Rollback on error
    setUsers(oldUsers);
    showNotification('Failed to update status', 'error');
  }
};
```

### 4. Debounce Search

```javascript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

function UserSearch() {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search function
  const debouncedSearch = debounce(async (term) => {
    const users = await userService.getAllUsers({ search: term });
    setUsers(users);
  }, 500); // Wait 500ms after user stops typing

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
    
    // Cleanup
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search users..."
    />
  );
}
```

### 5. Role-Based UI

```javascript
import { useUser } from './context/UserContext';

function AdminPanel() {
  const { currentUser } = useUser();

  // Check role
  const isAdmin = ['admin', 'superadmin'].includes(currentUser?.role);

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      {/* Admin-only UI */}
      {currentUser?.role === 'superadmin' && (
        <button>Create Admin User</button>
      )}
    </div>
  );
}
```

### 6. Form Validation

```javascript
// Use a validation library like Yup
import * as Yup from 'yup';

const userSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'Too short'),
  lastName: Yup.string()
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  phone: Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
    .nullable()
});

// In component
const handleSubmit = async (values) => {
  try {
    await userSchema.validate(values);
    // Valid, proceed with API call
    await userService.createUser(values);
  } catch (error) {
    // Show validation error
    setError(error.message);
  }
};
```

---

## 🔍 TROUBLESHOOTING

### Issue 1: "401 Unauthorized"

**Problem:** API returns 401 even after login

**Solutions:**
```javascript
// 1. Check if token is stored
console.log('Token:', localStorage.getItem('token'));

// 2. Check if token is sent in header
api.interceptors.request.use(config => {
  console.log('Request headers:', config.headers);
  return config;
});

// 3. Check token format
// Should be: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// Not: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 4. Token might be expired, try re-login
```

### Issue 2: "CORS Error"

**Problem:** Browser blocks request

**Solutions:**
```javascript
// Backend already configured CORS
// Check if you're using correct URL:

// ✅ GOOD
const API_BASE_URL = 'http://localhost:3001/api';

// ❌ BAD (missing /api)
const API_BASE_URL = 'http://localhost:3001';

// ❌ BAD (wrong port)
const API_BASE_URL = 'http://localhost:3000/api';
```

### Issue 3: Avatar not displaying

**Problem:** Image doesn't show after upload

**Solutions:**
```javascript
// 1. Check avatar path format
// Backend returns: "/uploads/avatars/avatar-1-123456.jpg"
// Frontend needs full URL:

const avatarUrl = `http://localhost:3001${user.avatar}`;

// 2. Or configure axios baseURL
<img src={`${axios.defaults.baseURL}${user.avatar}`} alt="Avatar" />

// 3. Handle null avatar
{user.avatar ? (
  <img src={`http://localhost:3001${user.avatar}`} />
) : (
  <div className="avatar-placeholder">No Avatar</div>
)}
```

### Issue 4: Pagination not working

**Problem:** Same data on all pages

**Solutions:**
```javascript
// 1. Check if page is sent to API
const params = { page: 1, limit: 10 }; // ✅
const params = { limit: 10 }; // ❌ Missing page

// 2. Check if state updates trigger new fetch
useEffect(() => {
  fetchUsers();
}, [page]); // ✅ Re-fetch when page changes

// 3. Reset to page 1 when filtering
const handleSearch = (term) => {
  setSearchTerm(term);
  setPage(1); // ✅ Reset page
};
```

### Issue 5: Form data not sending

**Problem:** API receives empty body

**Solutions:**
```javascript
// 1. Check Content-Type header
// ✅ GOOD for JSON
headers: { 'Content-Type': 'application/json' }
body: JSON.stringify(data)

// ✅ GOOD for file upload
headers: { 'Content-Type': 'multipart/form-data' }
body: formData

// ❌ BAD
headers: { 'Content-Type': 'application/json' }
body: formData // Should be JSON.stringify()

// 2. Check if data is in correct format
console.log('Sending data:', JSON.stringify(data, null, 2));
```

---

## 📱 RESPONSIVE DESIGN EXAMPLE

```javascript
import React, { useState, useEffect } from 'react';
import userService from './services/userService';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table or cards
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await userService.getAllUsers();
    if (response.success) {
      setUsers(response.data);
    }
  };

  return (
    <div className="user-management">
      <div className="header">
        <h1>User Management</h1>
        
        {!isMobile && (
          <div className="view-toggle">
            <button onClick={() => setViewMode('table')}>Table</button>
            <button onClick={() => setViewMode('cards')}>Cards</button>
          </div>
        )}
      </div>

      {viewMode === 'table' ? (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.phone || '-'}</td>
                <td>{user.status}</td>
                <td>
                  <button>Edit</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="user-cards">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="card-header">
                <h3>{user.name}</h3>
                <span className={`badge ${user.status}`}>{user.status}</span>
              </div>
              <div className="card-body">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Phone:</strong> {user.phone || '-'}</p>
                <p><strong>Department:</strong> {user.department || '-'}</p>
              </div>
              <div className="card-actions">
                <button>Edit</button>
                <button>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**CSS:**
```css
/* UserManagement.css */

.user-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* Table View */
.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

/* Card View */
.user-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.user-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge.active {
  background: #d4edda;
  color: #155724;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .user-table {
    display: none; /* Hide table on mobile */
  }

  .user-cards {
    grid-template-columns: 1fr; /* Single column on mobile */
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

---

## 🎓 COMPLETE EXAMPLE PROJECT STRUCTURE

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── user/
│   │   │   ├── UserProfile.jsx
│   │   │   ├── EditProfile.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   ├── AvatarUpload.jsx
│   │   │   ├── UserList.jsx
│   │   │   ├── CreateUser.jsx
│   │   │   └── UserCard.jsx
│   │   ├── common/
│   │   │   ├── Spinner.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── Modal.jsx
│   │   └── layout/
│   │       ├── Header.jsx
│   │       ├── Sidebar.jsx
│   │       └── Layout.jsx
│   │
│   ├── services/
│   │   ├── api.js              # Axios instance
│   │   ├── authService.js      # Login, logout
│   │   └── userService.js      # User CRUD operations
│   │
│   ├── context/
│   │   ├── UserContext.jsx     # Current user state
│   │   └── AuthContext.jsx     # Authentication state
│   │
│   ├── hooks/
│   │   ├── useAuth.js          # Auth hook
│   │   ├── useUser.js          # User hook
│   │   └── useDebounce.js      # Debounce hook
│   │
│   ├── utils/
│   │   ├── validation.js       # Form validation
│   │   ├── formatters.js       # Data formatters
│   │   └── constants.js        # API URLs, etc
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── UserManagementPage.jsx
│   │
│   ├── App.jsx
│   └── index.jsx
│
└── package.json
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Change `API_BASE_URL` to production URL
- [ ] Enable HTTPS for API calls
- [ ] Store tokens securely (consider httpOnly cookies)
- [ ] Implement token refresh mechanism
- [ ] Add request/response logging (for debugging)
- [ ] Implement rate limiting on frontend
- [ ] Add loading states for all async operations
- [ ] Test all error scenarios
- [ ] Optimize images (avatars)
- [ ] Implement lazy loading for large lists
- [ ] Add analytics tracking
- [ ] Test on different browsers
- [ ] Test responsive design
- [ ] Configure CORS for production domain

---

## 📞 SUPPORT & CONTACT

Jika ada pertanyaan atau masalah saat integrasi:

1. **Check Documentation:**
   - `API_ENDPOINTS.md` - List semua endpoints
   - `FRONTEND_INTEGRATION_GUIDE.md` - Guide ini
   - `USER_MANAGEMENT_FLOW_DIAGRAM.md` - Visual workflow

2. **Debug Steps:**
   - Check browser console for errors
   - Check network tab for API responses
   - Verify token is sent in headers
   - Test endpoints with Postman first

3. **Common Issues:**
   - 401 Error → Check token
   - CORS Error → Check URL
   - 403 Error → Check user role
   - 500 Error → Contact backend team

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Backend API Version:** v1  
**Maintained by:** TPMS Backend Team
