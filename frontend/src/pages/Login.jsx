import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                const res = await api.post('/token', formData);
                localStorage.setItem('token', res.data.access_token);
                navigate('/');
            } else {
                await api.post('/signup', { username, password });
                alert('Signup successful! Please login.');
                setIsLogin(true);
            }
        } catch (error) {
            alert('Authentication failed');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%' }}>
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>
                <p style={{ marginTop: 20, textAlign: 'center', cursor: 'pointer', color: '#007acc' }} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </p>
            </div>
        </div>
    );
};

export default Login;
