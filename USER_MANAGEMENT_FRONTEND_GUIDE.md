# 📘 Panduan Integrasi User Management - Frontend

## 📋 Daftar Isi
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints API](#endpoints-api)
- [Model Data](#model-data)
- [Contoh Implementasi](#contoh-implementasi)
- [Error Handling](#error-handling)
- [Role-Based Access Control](#role-based-access-control)

---

## 🎯 Overview

Sistem User Management menyediakan 13 endpoint untuk mengelola profil pengguna dan administrasi user. Sistem ini menggunakan Role-Based Access Control (RBAC) dengan 4 tingkat akses:

### Hierarki Role
```
superadmin (Level 4) - Full access ke semua fitur
    ↓
admin (Level 3) - Dapat mengelola operator & viewer
    ↓
operator (Level 2) - Akses operasional
    ↓
viewer (Level 1) - Read-only access
```

### Fitur Utama
- ✅ Manajemen profil pribadi (My Profile)
- ✅ Upload & hapus avatar (max 5MB)
- ✅ Ganti password
- ✅ Toggle Two-Factor Authentication
- ✅ CRUD user (admin only)
- ✅ Aktivasi/nonaktifkan user

---

## 🔐 Authentication

Semua endpoint memerlukan JWT token dalam header:

```javascript
const config = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};
```

**Login untuk mendapatkan token:**
```javascript
const response = await axios.post('http://localhost:3001/api/auth/login', {
  email: 'admin@tpms.com',
  password: 'admin123'
});

const token = response.data.token;
localStorage.setItem('token', token);
```

---

## 🌐 Endpoints API

### Base URL
```
http://localhost:3001/api/users
```

---

## 👤 Profile Management (6 Endpoints)

### 1. GET /api/users/me
**Deskripsi:** Mendapatkan profil user yang sedang login

**Authorization:** Semua role

**Request:**
```javascript
const response = await axios.get('http://localhost:3001/api/users/me', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "System",
    "email": "admin@tpms.com",
    "role": "superadmin",
    "phone": "+62812345678",
    "department": "IT Department",
    "bio": "System Administrator",
    "avatar": "/uploads/avatars/avatar-1-1703412345678.jpg",
    "two_factor_enabled": false,
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-12-24T08:00:00.000Z"
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### 2. PUT /api/users/me
**Deskripsi:** Update profil user yang sedang login

**Authorization:** Semua role

**Request:**
```javascript
const response = await axios.put('http://localhost:3001/api/users/me', {
  name: "John Doe",        // Will be split into firstName & lastName
  phone: "+62812345678",
  department: "Operations",
  bio: "Fleet Operations Manager"
}, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Full name (will be split) |
| phone | string | No | Phone number |
| department | string | No | Department name |
| bio | string | No | User biography/description |

**Response Success (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@tpms.com",
    "role": "superadmin",
    "phone": "+62812345678",
    "department": "Operations",
    "bio": "Fleet Operations Manager",
    "avatar": "/uploads/avatars/avatar-1-1703412345678.jpg",
    "two_factor_enabled": false,
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-12-24T08:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "No update data provided"
}
```

---

### 3. PATCH /api/users/me/password
**Deskripsi:** Ganti password user yang sedang login

**Authorization:** Semua role

**Request:**
```javascript
const response = await axios.patch('http://localhost:3001/api/users/me/password', {
  currentPassword: "oldpassword123",
  newPassword: "newpassword456"
}, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | Password lama |
| newPassword | string | Yes | Password baru (min 6 karakter) |

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "New password must be at least 6 characters"
}
```

---

### 4. POST /api/users/me/avatar
**Deskripsi:** Upload avatar user yang sedang login

**Authorization:** Semua role

**Content-Type:** `multipart/form-data`

**Request:**
```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

const response = await axios.post('http://localhost:3001/api/users/me/avatar', formData, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

**File Requirements:**
- **Max Size:** 5MB
- **Allowed Types:** jpeg, jpg, png, gif, webp
- **Field Name:** `avatar`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": "/uploads/avatars/avatar-1-1703412345678.jpg"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Only image files are allowed (jpeg, jpg, png, gif, webp)"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "File size cannot exceed 5MB"
}
```

---

### 5. DELETE /api/users/me/avatar
**Deskripsi:** Hapus avatar user yang sedang login

**Authorization:** Semua role

**Request:**
```javascript
const response = await axios.delete('http://localhost:3001/api/users/me/avatar', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "No avatar to delete"
}
```

---

### 6. PATCH /api/users/me/two-factor
**Deskripsi:** Toggle Two-Factor Authentication

**Authorization:** Semua role

**Request:**
```javascript
const response = await axios.patch('http://localhost:3001/api/users/me/two-factor', {
  enabled: true  // atau false untuk disable
}, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| enabled | boolean | Yes | true = enable, false = disable |

**Response Success (200):**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully",
  "data": {
    "two_factor_enabled": true
  }
}
```

---

## 👥 Admin User Management (7 Endpoints)

### 7. GET /api/users
**Deskripsi:** Mendapatkan list semua user (dengan pagination & filter)

**Authorization:** Admin, Superadmin

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Halaman ke-n |
| limit | number | 10 | Jumlah data per halaman |
| search | string | - | Cari berdasarkan name/email |
| role | string | - | Filter berdasarkan role |
| status | string | - | Filter berdasarkan status |

**Request:**
```javascript
const response = await axios.get('http://localhost:3001/api/users', {
  params: {
    page: 1,
    limit: 10,
    search: 'john',
    role: 'operator',
    status: 'active'
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 2,
        "firstName": "John",
        "lastName": "Operator",
        "email": "operator@tpms.com",
        "role": "operator",
        "phone": "+62812345679",
        "department": "Operations",
        "bio": "Fleet operator",
        "avatar": null,
        "two_factor_enabled": false,
        "status": "active",
        "created_at": "2024-01-02T00:00:00.000Z",
        "updated_at": "2024-12-24T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

---

### 8. GET /api/users/:id
**Deskripsi:** Mendapatkan detail user berdasarkan ID

**Authorization:** Admin, Superadmin

**Request:**
```javascript
const userId = 2;
const response = await axios.get(`http://localhost:3001/api/users/${userId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "firstName": "John",
    "lastName": "Operator",
    "email": "operator@tpms.com",
    "role": "operator",
    "phone": "+62812345679",
    "department": "Operations",
    "bio": "Fleet operator",
    "avatar": null,
    "two_factor_enabled": false,
    "status": "active",
    "created_at": "2024-01-02T00:00:00.000Z",
    "updated_at": "2024-12-24T08:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 9. POST /api/users
**Deskripsi:** Membuat user baru

**Authorization:** Admin, Superadmin

**Permissions:**
- **Superadmin:** Dapat membuat semua role
- **Admin:** Hanya dapat membuat operator & viewer

**Request:**
```javascript
const response = await axios.post('http://localhost:3001/api/users', {
  name: "Jane Viewer",
  email: "viewer@tpms.com",
  password: "viewer123",
  role: "viewer",
  phone: "+62812345680",
  department: "Monitoring",
  bio: "Fleet monitoring staff",
  status: "active"
}, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full name (akan di-split) |
| email | string | Yes | Email (harus unique) |
| password | string | Yes | Password (min 6 karakter) |
| role | string | Yes | superadmin/admin/operator/viewer |
| phone | string | No | Phone number |
| department | string | No | Department name |
| bio | string | No | User biography |
| status | string | No | active/inactive (default: active) |

**Response Success (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 3,
    "firstName": "Jane",
    "lastName": "Viewer",
    "email": "viewer@tpms.com",
    "role": "viewer",
    "phone": "+62812345680",
    "department": "Monitoring",
    "bio": "Fleet monitoring staff",
    "avatar": null,
    "two_factor_enabled": false,
    "status": "active",
    "created_at": "2024-12-24T08:00:00.000Z",
    "updated_at": "2024-12-24T08:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "You can only create users with role: operator, viewer"
}
```

---

### 10. PUT /api/users/:id
**Deskripsi:** Update data user

**Authorization:** Admin, Superadmin

**Permissions:**
- **Superadmin:** Dapat update semua user
- **Admin:** Hanya dapat update operator & viewer

**Request:**
```javascript
const userId = 3;
const response = await axios.put(`http://localhost:3001/api/users/${userId}`, {
  name: "Jane Updated Viewer",
  phone: "+62812345999",
  department: "Monitoring Team",
  bio: "Senior monitoring staff",
  role: "viewer"  // optional
}, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Full name |
| email | string | No | Email (harus unique) |
| role | string | No | New role |
| phone | string | No | Phone number |
| department | string | No | Department |
| bio | string | No | Biography |

**Response Success (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 3,
    "firstName": "Jane",
    "lastName": "Updated Viewer",
    "email": "viewer@tpms.com",
    "role": "viewer",
    "phone": "+62812345999",
    "department": "Monitoring Team",
    "bio": "Senior monitoring staff",
    "avatar": null,
    "two_factor_enabled": false,
    "status": "active",
    "created_at": "2024-12-24T08:00:00.000Z",
    "updated_at": "2024-12-24T08:05:00.000Z"
  }
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "You don't have permission to modify this user"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 11. PATCH /api/users/:id/status
**Deskripsi:** Aktivasi/nonaktifkan user

**Authorization:** Admin, Superadmin

**Permissions:**
- **Superadmin:** Dapat update status semua user
- **Admin:** Hanya dapat update status operator & viewer

**Request:**
```javascript
const userId = 3;
const response = await axios.patch(`http://localhost:3001/api/users/${userId}/status`, {
  status: "inactive"  // atau "active"
}, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | active / inactive |

**Response Success (200):**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "id": 3,
    "status": "inactive"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Invalid status. Must be 'active' or 'inactive'"
}
```

---

### 12. DELETE /api/users/:id
**Deskripsi:** Hapus user (soft delete)

**Authorization:** Admin, Superadmin

**Permissions:**
- **Superadmin:** Dapat delete semua user
- **Admin:** Hanya dapat delete operator & viewer

**Request:**
```javascript
const userId = 3;
const response = await axios.delete(`http://localhost:3001/api/users/${userId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "You don't have permission to delete this user"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 📊 Model Data

### User Object Structure
```typescript
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'superadmin' | 'admin' | 'operator' | 'viewer';
  phone?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  two_factor_enabled: boolean;
  status: 'active' | 'inactive';
  created_at: string;  // ISO 8601 format
  updated_at: string;  // ISO 8601 format
}
```

---

## 💻 Contoh Implementasi

### React Component - My Profile Page

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    bio: ''
  });

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:3001/api';

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data.data);
      setFormData({
        name: `${response.data.data.firstName} ${response.data.data.lastName}`,
        phone: response.data.data.phone || '',
        department: response.data.data.department || '',
        bio: response.data.data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert(error.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/users/me`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setProfile(response.data.data);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size cannot exceed 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only image files are allowed (jpeg, jpg, png, gif, webp)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(`${API_URL}/users/me/avatar`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh profile to get new avatar URL
      fetchProfile();
      alert('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(error.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return;

    try {
      await axios.delete(`${API_URL}/users/me/avatar`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchProfile();
      alert('Avatar deleted successfully!');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      alert(error.response?.data?.message || 'Failed to delete avatar');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <h1>My Profile</h1>

      {/* Avatar Section */}
      <div className="avatar-section">
        {profile.avatar ? (
          <img 
            src={`${API_URL}${profile.avatar}`} 
            alt="Avatar" 
            className="avatar-image"
          />
        ) : (
          <div className="avatar-placeholder">
            {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
          </div>
        )}
        
        <input 
          type="file" 
          id="avatar-upload" 
          accept="image/*"
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
        
        <button onClick={() => document.getElementById('avatar-upload').click()}>
          Upload Avatar
        </button>
        
        {profile.avatar && (
          <button onClick={handleDeleteAvatar} className="btn-danger">
            Delete Avatar
          </button>
        )}
      </div>

      {/* Profile Form */}
      {!editing ? (
        <div className="profile-view">
          <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          <p><strong>Phone:</strong> {profile.phone || '-'}</p>
          <p><strong>Department:</strong> {profile.department || '-'}</p>
          <p><strong>Bio:</strong> {profile.bio || '-'}</p>
          <p><strong>2FA:</strong> {profile.two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Status:</strong> {profile.status}</p>
          
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="profile-form">
          <div className="form-group">
            <label>Name:</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Phone:</label>
            <input 
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Department:</label>
            <input 
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Bio:</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MyProfile;
```

---

### React Component - Change Password

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:3001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New password and confirmation do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await axios.patch(`${API_URL}/users/me/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current Password:</label>
          <input 
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>New Password:</label>
          <input 
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
            required
            minLength={6}
          />
          <small>Minimum 6 characters</small>
        </div>

        <div className="form-group">
          <label>Confirm New Password:</label>
          <input 
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
```

---

### React Component - User Management (Admin)

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
    phone: '',
    department: '',
    bio: '',
    status: 'active'
  });

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`, {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          role: filters.role,
          status: filters.status
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API_URL}/users`, newUser, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('User created successfully!');
      setShowCreateModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'operator',
        phone: '',
        department: '',
        bio: '',
        status: 'active'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await axios.patch(`${API_URL}/users/${userId}/status`, 
        { status: newStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert('User status updated successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="user-management-container">
      <h1>User Management</h1>

      {/* Filters */}
      <div className="filters">
        <input 
          type="text"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        
        <select 
          value={filters.role}
          onChange={(e) => setFilters({...filters, role: e.target.value})}
        >
          <option value="">All Roles</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
          <option value="operator">Operator</option>
          <option value="viewer">Viewer</option>
        </select>

        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button onClick={() => setShowCreateModal(true)}>
          + Create User
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.department || '-'}</td>
                  <td>
                    <span className={`status status-${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className="btn-sm"
                    >
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setPagination({...pagination, page: pagination.page - 1})}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button 
              onClick={() => setPagination({...pagination, page: pagination.page + 1})}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <input 
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
              />
              <input 
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
              <input 
                type="password"
                placeholder="Password (min 6 characters)"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
                minLength={6}
              />
              <select 
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
                {/* Admin can only create operator & viewer */}
              </select>
              <input 
                type="text"
                placeholder="Phone (optional)"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              />
              <input 
                type="text"
                placeholder="Department (optional)"
                value={newUser.department}
                onChange={(e) => setNewUser({...newUser, department: e.target.value})}
              />
              <textarea 
                placeholder="Bio (optional)"
                value={newUser.bio}
                onChange={(e) => setNewUser({...newUser, bio: e.target.value})}
              />
              
              <div className="modal-actions">
                <button type="submit">Create User</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
```

---

## 🚨 Error Handling

### Common Error Responses

```javascript
// 400 Bad Request
{
  "success": false,
  "message": "Validation error message"
}

// 401 Unauthorized
{
  "success": false,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "success": false,
  "message": "Access denied. Admin role required."
}

// 404 Not Found
{
  "success": false,
  "message": "User not found"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "Internal server error"
}
```

### Best Practices untuk Error Handling

```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    // Handle specific error codes
    if (error.response) {
      switch (error.response.status) {
        case 400:
          alert(`Validation Error: ${error.response.data.message}`);
          break;
        case 401:
          // Redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          alert('Access Denied: You do not have permission for this action');
          break;
        case 404:
          alert('Not Found: The requested resource does not exist');
          break;
        case 500:
          alert('Server Error: Please try again later');
          break;
        default:
          alert('An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      alert('Network Error: Unable to connect to server');
    } else {
      // Something else happened
      alert('Error: ' + error.message);
    }
    
    throw error; // Re-throw if needed
  }
};

// Usage
const fetchProfile = () => handleApiCall(() => 
  axios.get(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
);
```

---

## 🔐 Role-Based Access Control (RBAC)

### Permission Matrix

| Endpoint | Superadmin | Admin | Operator | Viewer |
|----------|------------|-------|----------|--------|
| GET /api/users/me | ✅ | ✅ | ✅ | ✅ |
| PUT /api/users/me | ✅ | ✅ | ✅ | ✅ |
| PATCH /api/users/me/password | ✅ | ✅ | ✅ | ✅ |
| POST /api/users/me/avatar | ✅ | ✅ | ✅ | ✅ |
| DELETE /api/users/me/avatar | ✅ | ✅ | ✅ | ✅ |
| PATCH /api/users/me/two-factor | ✅ | ✅ | ✅ | ✅ |
| GET /api/users | ✅ | ✅ | ❌ | ❌ |
| GET /api/users/:id | ✅ | ✅ | ❌ | ❌ |
| POST /api/users | ✅ | ✅* | ❌ | ❌ |
| PUT /api/users/:id | ✅ | ✅* | ❌ | ❌ |
| PATCH /api/users/:id/status | ✅ | ✅* | ❌ | ❌ |
| DELETE /api/users/:id | ✅ | ✅* | ❌ | ❌ |

**\* Admin restrictions:**
- Can only create/modify/delete users with role: `operator` or `viewer`
- Cannot create/modify/delete: `superadmin` or `admin`

### Frontend Route Protection

```jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole'); // Store role during login

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Usage in App.js
<Route 
  path="/users" 
  element={
    <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
      <UserManagement />
    </ProtectedRoute>
  } 
/>
```

---

## 📝 Tips & Best Practices

### 1. Token Management
```javascript
// Store token after login
const handleLogin = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  const { token, user } = response.data;
  
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userId', user.id);
};

// Clear token on logout
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  window.location.href = '/login';
};
```

### 2. Avatar Display
```javascript
// Always use full URL for avatar
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  return `http://localhost:3001${avatarPath}`;
};

// Usage
<img src={getAvatarUrl(user.avatar)} alt="Avatar" />
```

### 3. Input Validation (Frontend)
```javascript
// Email validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Password strength
const isStrongPassword = (password) => {
  return password.length >= 6;
};

// Phone number (Indonesian format)
const isValidPhone = (phone) => {
  return /^(\+62|62|0)[0-9]{9,12}$/.test(phone);
};
```

### 4. Debounce Search
```javascript
import { useState, useEffect } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchUsers(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 🔗 Related Documentation

- [API Response Format Clarification](./API_RESPONSE_FORMAT_CLARIFICATION.md)
- [Frontend Complete Guide](./FRONTEND_COMPLETE_GUIDE.md)
- [Local Development Setup](./LOCAL_DEVELOPMENT_SETUP.md)

---

## 📞 Support

Jika ada pertanyaan atau menemukan bug, silakan hubungi:
- Email: support@tpms.com
- Dokumentasi lengkap: `docs/`

---

**Last Updated:** December 24, 2024
**Version:** 1.0.0
**Author:** TPMS Backend Team
