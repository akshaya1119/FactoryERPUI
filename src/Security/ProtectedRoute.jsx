import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserToken } from '../store/useUserToken';
import { jwtDecode } from 'jwt-decode';
import AuthService from '../CustomHooks/ApiServices/AuthService';
import { ToastContainer } from 'react-toastify';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Check if error is related to undefined property access
        if (error instanceof TypeError && error.message.includes('Cannot read properties of undefined')) {
            // Redirect to login for auth-related errors
            return <Navigate to="/login" replace />;
        }
    }

    render() {
        if (this.state.hasError) {
            // Handle TypeError specifically
            if (this.state.error instanceof TypeError && 
                this.state.error.message.includes('Cannot read properties of undefined')) {
                return <Navigate to="/login" replace />;
            }
            return <Navigate to="/cudashboard" replace />;
        }

        return this.props.children;
    }
}

const ProtectedRoute = ({ component: Component }) => {
    const token = useUserToken();
    const { logout } = AuthService;

    const isTokenValid = (token) => {
        if (!token) return false;
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decodedToken.exp > currentTime;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    };

    useEffect(() => {
        const handleInvalidToken = async () => {
            if (!token || !isTokenValid(token)) {
                console.log('Invalid or expired token - redirecting to login');
                await logout();
            }
        };
        handleInvalidToken();
    }, [token, logout]);

    if (!token || !isTokenValid(token)) {
        return <Navigate to="/login" replace />;
    }

    return (
        <ErrorBoundary>
            <Component />
        </ErrorBoundary>
    );
};

export default ProtectedRoute;