import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Profile = () => {
    const [user, setUser] = useState({ username: '', profile_image: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/users/me');
                setUser(res.data);
            } catch (e) { }
        };
        fetchUser();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put('/users/me', {
                username: user.username,
                profile_image: user.profile_image
            });
            alert('Profile updated');
        } catch (e) { alert('Update failed'); }
    };

    const handleChangePassword = async () => {
        try {
            await api.put('/users/me', { password: newPassword });
            alert('Password updated');
            setShowPasswordModal(false);
            setNewPassword('');
        } catch (e) { alert('Password update failed'); }
    };

    return (
        <div className="container">
            <div style={{ width: '100%', maxWidth: 600 }}>
                <h1>Profile</h1>
                <div className="recipe-card">
                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-group">
                            <label>Username (NickName)</label>
                            <input
                                type="text"
                                value={user.username}
                                onChange={(e) => setUser({ ...user, username: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Profile Image URL</label>
                            <input
                                type="text"
                                value={user.profile_image || ''}
                                onChange={(e) => setUser({ ...user, profile_image: e.target.value })}
                                placeholder="https://example.com/avatar.png"
                            />
                        </div>
                        <button type="submit" className="btn">Update Profile</button>
                    </form>

                    <hr style={{ borderColor: '#3e3e42', margin: '20px 0' }} />

                    <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
                        Change Password
                    </button>
                </div>

                {showPasswordModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Change Password</h3>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button className="btn" onClick={handleChangePassword}>Save</button>
                                <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
