// src/pages/Settings.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import TailwindLayout from '../components/layout/TailwindLayout';
import {
  UserIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  BellIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  ChatBubbleLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    bio: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const fileInputRef = useRef(null);

  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  const API_URL = 'http://localhost:3001/api';

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data?.data;
      setProfile(data);
      setFormData({
        name: `${data.firstName} ${data.lastName}`.trim(),
        phone: data.phone || '',
        department: data.department || '',
        bio: data.bio || ''
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(`${API_URL}/users/me`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setProfile(response.data?.data);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size cannot exceed 5MB');
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only image files are allowed (jpeg, jpg, png, gif, webp)');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await axios.post(`${API_URL}/users/me/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      await fetchProfile();
      alert('Avatar uploaded successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return;
    try {
      await axios.delete(`${API_URL}/users/me/avatar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfile();
      alert('Avatar deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete avatar');
    }
  };

  const handleToggleTwoFactor = async (enabled) => {
    try {
      const response = await axios.patch(`${API_URL}/users/me/two-factor`, { enabled }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setProfile(prev => ({ ...prev, two_factor_enabled: response.data?.data?.two_factor_enabled }));
      alert(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle two-factor');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirmation do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }
    try {
      await axios.patch(`${API_URL}/users/me/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      alert('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  const tabs = [
    { id: 'profile', name: 'My Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon }
  ];

  return (
    <TailwindLayout>
      <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your profile information and system access credentials.
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              {activeTab === 'profile' && editing && (
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="relative group cursor-pointer">
                    <div className="h-28 w-28 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-md overflow-hidden">
                      {profile?.avatar ? (
                        <img
                          src={`${API_URL}${profile.avatar}`}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {profile?.firstName?.charAt(0) || 'U'}
                          {profile?.lastName?.charAt(0) || ''}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow-md border border-gray-200 text-gray-500 group-hover:text-indigo-600 transition-colors" onClick={() => fileInputRef.current?.click()}>
                      <PencilSquareIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    {profile ? `${profile.firstName} ${profile.lastName}` : ''}
                  </h3>
                  <p className="text-sm text-gray-500">{profile?.role}</p>
                  <div className="mt-4 flex space-x-2 w-full">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium mx-auto border border-green-200">
                      Status: {profile?.status || 'active'}
                    </span>
                  </div>
                </div>

                {/* Role Permissions */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Role Permissions
                  </h4>
                  <div className="space-y-2">
                    {['My Profile', 'Change Password', 'Two-Factor Toggle'].map((permission) => (
                      <div key={permission} className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avatar controls */}
                <div className="mt-6 border-t border-gray-100 pt-6 w-full">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Upload Avatar</button>
                    {profile?.avatar && (
                      <button onClick={handleDeleteAvatar} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Delete Avatar</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* My Profile */}
              {activeTab === 'profile' && (
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                      My Profile
                    </h3>
                    {!editing && (
                      <button onClick={() => setEditing(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Edit Profile</button>
                    )}
                  </div>

                  {loading ? (
                    <div>Loading...</div>
                  ) : (
                    <>
                      {!editing ? (
                        <div className="space-y-2">
                          <p className="text-sm"><strong>Name:</strong> {profile?.firstName} {profile?.lastName}</p>
                          <p className="text-sm"><strong>Email:</strong> {profile?.email}</p>
                          <p className="text-sm"><strong>Role:</strong> {profile?.role}</p>
                          <p className="text-sm"><strong>Phone:</strong> {profile?.phone || '-'}</p>
                          <p className="text-sm"><strong>Department:</strong> {profile?.department || '-'}</p>
                          <p className="text-sm"><strong>Bio:</strong> {profile?.bio || '-'}</p>
                          <p className="text-sm"><strong>2FA:</strong> {profile?.two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
                          <p className="text-sm"><strong>Status:</strong> {profile?.status}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="3" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 px-3 py-2" />
                          </div>
                          <div className="md:col-span-2 flex gap-2">
                            <button onClick={handleSaveChanges} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Save Changes</button>
                            <button onClick={() => { setEditing(false); fetchProfile(); }} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm">Cancel</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                    Security Settings
                  </h3>
                  <div className="space-y-8">
                    {/* Two-Factor */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Two-Factor Authentication</h4>
                        <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!profile?.two_factor_enabled}
                          onChange={(e) => handleToggleTwoFactor(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    {/* Change Password */}
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Change Password</h4>
                      <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input type="password" value={passwordForm.currentPassword} onChange={(e)=>setPasswordForm(p=>({...p,currentPassword:e.target.value}))} required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input type="password" value={passwordForm.newPassword} onChange={(e)=>setPasswordForm(p=>({...p,newPassword:e.target.value}))} required minLength={6} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                          <input type="password" value={passwordForm.confirmPassword} onChange={(e)=>setPasswordForm(p=>({...p,confirmPassword:e.target.value}))} required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3" />
                        </div>
                        <div className="md:col-span-2">
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Change Password</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Email Notifications', description: 'Receive email updates about fleet activities' },
                      { title: 'Push Notifications', description: 'Get instant alerts on your device' },
                      { title: 'SMS Alerts', description: 'Receive critical alerts via SMS' },
                      { title: 'Weekly Reports', description: 'Get weekly summary reports via email' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center group">
          <ChatBubbleLeftIcon className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </TailwindLayout>
  );
};

export default Settings;