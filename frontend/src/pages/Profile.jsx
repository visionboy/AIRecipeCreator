import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { Camera } from 'lucide-react';

const Profile = () => {
    const [user, setUser] = useState({ username: '', profile_image: '' });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (e) { }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        // Password validation
        if (password && password !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }
        if (password && !currentPassword) {
            alert("Please enter your current password to change it.");
            return;
        }

        try {
            // Only send password update if populated
            const payload = {
                username: user.username,
            };

            if (password) {
                payload.password = password;
                payload.current_password = currentPassword;
            }

            const res = await api.put('/users/me', payload);
            setUser(res.data);
            alert('Profile updated');
            setPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
            window.dispatchEvent(new Event('user-updated'));
        } catch (error) {
            alert(error.response?.data?.detail || 'Update failed');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/users/me/image', formData);
            setUser(res.data);
            window.dispatchEvent(new Event('user-updated'));
        } catch (error) {
            alert('Image upload failed');
        }
    };

    return (
        <div className="container">
            <div style={{ width: '100%' }}>
                <h1>Profile</h1>
                <div className="recipe-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Profile Image Upload */}
                    <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 30 }}>
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '3px solid #007acc',
                                cursor: 'pointer',
                                backgroundColor: '#333'
                            }}
                            onClick={() => document.getElementById('profileImageInput').click()}
                        >
                            <img
                                src={user.profile_image || "https://via.placeholder.com/150"}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: '#007acc',
                                borderRadius: '50%',
                                padding: 8,
                                cursor: 'pointer',
                                border: '2px solid #1e1e1e'
                            }}
                            onClick={() => document.getElementById('profileImageInput').click()}
                        >
                            <Camera size={18} color="white" />
                        </div>
                        <input
                            type="file"
                            id="profileImageInput"
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </div>

                    <form onSubmit={handleUpdateProfile} style={{ width: '100%' }}>
                        <div className="form-group">
                            <label>Username (Read Only)</label>
                            <input
                                type="text"
                                value={user.username}
                                disabled
                                style={{ color: '#888', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div style={{ marginTop: 30, borderTop: '1px solid #3e3e42', paddingTop: 20 }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: 20 }}>Change Password</h3>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            style={{ width: '100%', marginTop: 20 }}
                            disabled={!currentPassword && !password}
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
