import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// Theme and Layout
import theme from './config/theme';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import Analytics from './pages/Analytics';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Components
import AuthGuard from './components/AuthGuard';
import LoadingScreen from './components/LoadingScreen';

// Services
import { initializeWebSocket } from './services/websocket';
import { initializeAnalytics } from './services/analytics';
import { checkAuth } from './services/auth';

// Context
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';

const App = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                // Check authentication
                const authResult = await checkAuth();
                setIsAuthenticated(authResult.isAuthenticated);

                // Initialize services
                await Promise.all([
                    initializeWebSocket(),
                    initializeAnalytics()
                ]);

                setIsInitialized(true);
            } catch (error) {
                console.error('Initialization error:', error);
                // Handle initialization error
            }
        };

        initialize();
    }, []);

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    return (
        <Router>
            <CustomThemeProvider>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <SnackbarProvider maxSnack={3}>
                        <UserProvider>
                            <NotificationProvider>
                                <AuthGuard isAuthenticated={isAuthenticated}>
                                    <DashboardLayout>
                                        <Switch>
                                            <Route exact path="/" component={Dashboard} />
                                            <Route path="/listings" component={Listings} />
                                            <Route path="/analytics" component={Analytics} />
                                            <Route path="/integrations" component={Integrations} />
                                            <Route path="/settings" component={Settings} />
                                            <Route path="/profile" component={Profile} />
                                        </Switch>
                                    </DashboardLayout>
                                </AuthGuard>
                            </NotificationProvider>
                        </UserProvider>
                    </SnackbarProvider>
                </ThemeProvider>
            </CustomThemeProvider>
        </Router>
    );
};

export default App;

// Dashboard Layout Component
const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onToggle={toggleSidebar} 
            />
            <main className="dashboard-main">
                <Header 
                    onMenuClick={toggleSidebar}
                    onNotificationsClick={toggleNotifications}
                />
                <div className="dashboard-content">
                    {children}
                </div>
            </main>
            <NotificationsPanel 
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />
        </div>
    );
};

// Initialize WebSocket connection
const websocket = new WebSocket('ws://localhost:3000');

websocket.onopen = () => {
    console.log('WebSocket connected');
};

websocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
};

websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Handle WebSocket messages
const handleWebSocketMessage = (data) => {
    switch (data.type) {
        case 'listing_update':
            // Handle listing update
            break;
        case 'analytics_update':
            // Handle analytics update
            break;
        case 'notification':
            // Handle new notification
            break;
        default:
            console.warn('Unknown message type:', data.type);
    }
};

// Export WebSocket instance
export const ws = websocket;
