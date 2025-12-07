import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, History, Heart, Settings } from 'lucide-react';
import api from '../utils/api';

const Navbar = () => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/users/me');
                setUser(res.data);
            } catch (e) { }
        };
        fetchUser();

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="header">
            <div className="logo">
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Cooking Room</Link>
            </div>
            <div className="profile-menu" ref={menuRef}>
                <div className="profile-icon" onClick={() => setShowMenu(!showMenu)}>
                    {user && user.profile_image ? (
                        <img src={user.profile_image} alt="Profile" />
                    ) : (
                        <User size={20} />
                    )}
                </div>
                <div className={`dropdown-menu ${showMenu ? 'show' : ''}`}>
                    <Link to="/history" className="dropdown-item" onClick={() => setShowMenu(false)}>
                        <History size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> My History
                    </Link>
                    <Link to="/favorites" className="dropdown-item" onClick={() => setShowMenu(false)}>
                        <Heart size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Favorites
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                        <Settings size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Profile
                    </Link>
                    <div className="dropdown-item" onClick={handleSignOut}>
                        <LogOut size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Sign Out
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
