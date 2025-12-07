import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AiChef from './pages/AiChef';
import MyHistory from './pages/MyHistory';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => (
    <div className="layout">
        <Navbar />
        <div className="main-content">{children}</div>
    </div>
);

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                    <PrivateRoute>
                        <Layout><AiChef /></Layout>
                    </PrivateRoute>
                } />
                <Route path="/history" element={
                    <PrivateRoute>
                        <Layout><MyHistory /></Layout>
                    </PrivateRoute>
                } />
                <Route path="/favorites" element={
                    <PrivateRoute>
                        <Layout><Favorites /></Layout>
                    </PrivateRoute>
                } />
                <Route path="/profile" element={
                    <PrivateRoute>
                        <Layout><Profile /></Layout>
                    </PrivateRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;
