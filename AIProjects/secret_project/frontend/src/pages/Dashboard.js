import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, IconButton } from '@mui/material';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';

// Components
import MetricCard from '../components/MetricCard';
import PerformanceChart from '../components/PerformanceChart';
import AIInsightsPanel from '../components/AIInsightsPanel';
import IntegrationStatus from '../components/IntegrationStatus';
import AlertsPanel from '../components/AlertsPanel';

// Services
import { fetchDashboardData } from '../services/analytics';
import { fetchAIInsights } from '../services/ai';
import { fetchIntegrationStatus } from '../services/integration';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [aiInsights, setAIInsights] = useState(null);
    const [integrationStatus, setIntegrationStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            const [dashData, insights, integrations] = await Promise.all([
                fetchDashboardData(),
                fetchAIInsights(),
                fetchIntegrationStatus()
            ]);

            setDashboardData(dashData);
            setAIInsights(insights);
            setIntegrationStatus(integrations);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    const {
        revenueMetrics,
        listingMetrics,
        performanceMetrics,
        marketInsights
    } = dashboardData || {};

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Enterprise Dashboard
                </Typography>
                <IconButton onClick={loadDashboardData} color="primary">
                    <RefreshIcon />
                </IconButton>
            </Box>

            {/* Key Metrics */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total Revenue"
                        value={revenueMetrics?.total}
                        trend={revenueMetrics?.trend}
                        icon={<TrendingUpIcon />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Listings"
                        value={listingMetrics?.active}
                        trend={listingMetrics?.trend}
                        icon={<StorefrontIcon />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Conversion Rate"
                        value={performanceMetrics?.conversionRate}
                        trend={performanceMetrics?.trend}
                        icon={<TimelineIcon />}
                        color="info"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="System Health"
                        value={performanceMetrics?.systemHealth}
                        trend={performanceMetrics?.trend}
                        icon={<SpeedIcon />}
                        color="warning"
                    />
                </Grid>
            </Grid>

            {/* Charts and Analytics */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={8}>
                    <Paper elevation={2}>
                        <Box p={2}>
                            <Typography variant="h6" gutterBottom>
                                Performance Overview
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={performanceMetrics?.timeline}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8884d8"
                                        name="Revenue"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="listings"
                                        stroke="#82ca9d"
                                        name="Listings"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={2}>
                        <Box p={2}>
                            <Typography variant="h6" gutterBottom>
                                Market Distribution
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={marketInsights?.distribution}
                                        dataKey="value"
                                        nameKey="platform"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        label
                                    />
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* AI Insights and Integration Status */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <AIInsightsPanel insights={aiInsights} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <IntegrationStatus status={integrationStatus} />
                </Grid>
            </Grid>

            {/* System Alerts and Notifications */}
            <Box mt={3}>
                <AlertsPanel />
            </Box>
        </Box>
    );
};

// Loading Spinner Component
const LoadingSpinner = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
    </Box>
);

// Error Message Component
const ErrorMessage = ({ message }) => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error" variant="h6">
            {message}
        </Typography>
    </Box>
);

export default Dashboard;
