import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    IconButton,
    Button,
    LinearProgress,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CircularProgress
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Timeline as TimelineIcon,
    Storage as StorageIcon,
    Speed as SpeedIcon,
    CloudSync as CloudSyncIcon
} from '@mui/icons-material';

const IntegrationStatus = ({ status }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async (platform) => {
        setIsSyncing(true);
        try {
            // In real implementation, call sync service here
            await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePlatformClick = (platform) => {
        setSelectedPlatform(platform);
        setIsDialogOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'success';
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy':
                return <CheckCircleIcon color="success" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'error':
                return <ErrorIcon color="error" />;
            default:
                return <CloudSyncIcon />;
        }
    };

    return (
        <Paper elevation={2}>
            <Box p={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="h2">
                        Integration Status
                    </Typography>
                    <Box>
                        <Tooltip title="Refresh Status">
                            <IconButton onClick={() => handleSync('all')} disabled={isSyncing}>
                                {isSyncing ? <CircularProgress size={24} /> : <RefreshIcon />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Integration Settings">
                            <IconButton>
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    {status?.platforms?.map((platform) => (
                        <Grid item xs={12} sm={6} md={4} key={platform.name}>
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                                onClick={() => handlePlatformClick(platform)}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle1">
                                        {platform.name}
                                    </Typography>
                                    {getStatusIcon(platform.status)}
                                </Box>
                                <Box mt={1}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={platform.syncProgress}
                                        color={getStatusColor(platform.status)}
                                    />
                                </Box>
                                <Box mt={1} display="flex" justifyContent="space-between">
                                    <Chip
                                        label={`${platform.activeListings} listings`}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Typography variant="caption" color="textSecondary">
                                        Last sync: {platform.lastSync}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* System Health Overview */}
                <Box mt={3}>
                    <Typography variant="subtitle1" gutterBottom>
                        System Health
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <HealthMetric
                                icon={<SpeedIcon />}
                                title="API Performance"
                                value={status?.health?.apiLatency}
                                unit="ms"
                                status={status?.health?.apiStatus}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <HealthMetric
                                icon={<StorageIcon />}
                                title="Sync Queue"
                                value={status?.health?.queueSize}
                                unit="tasks"
                                status={status?.health?.queueStatus}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <HealthMetric
                                icon={<TimelineIcon />}
                                title="Error Rate"
                                value={status?.health?.errorRate}
                                unit="%"
                                status={status?.health?.errorStatus}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Integration Details Dialog */}
                <Dialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {selectedPlatform?.name} Integration Details
                    </DialogTitle>
                    <DialogContent>
                        {selectedPlatform?.status === 'error' && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {selectedPlatform?.errorMessage}
                            </Alert>
                        )}
                        
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <CloudSyncIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Sync Status"
                                    secondary={`Last successful sync: ${selectedPlatform?.lastSync}`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <StorageIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Data Statistics"
                                    secondary={`${selectedPlatform?.activeListings} active listings, ${selectedPlatform?.totalProducts} total products`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <TimelineIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Performance Metrics"
                                    secondary={`API Latency: ${selectedPlatform?.metrics?.apiLatency}ms, Error Rate: ${selectedPlatform?.metrics?.errorRate}%`}
                                />
                            </ListItem>
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleSync(selectedPlatform?.name)}
                            disabled={isSyncing}
                            startIcon={isSyncing ? <CircularProgress size={20} /> : <RefreshIcon />}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Paper>
    );
};

const HealthMetric = ({ icon, title, value, unit, status }) => (
    <Box
        sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center'
        }}
    >
        <Box sx={{ mr: 2 }}>{icon}</Box>
        <Box>
            <Typography variant="body2" color="textSecondary">
                {title}
            </Typography>
            <Typography variant="h6">
                {value} {unit}
            </Typography>
            <Chip
                label={status}
                size="small"
                color={getStatusColor(status)}
                sx={{ mt: 0.5 }}
            />
        </Box>
    </Box>
);

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'healthy':
            return 'success';
        case 'warning':
            return 'warning';
        case 'error':
            return 'error';
        default:
            return 'default';
    }
};

export default IntegrationStatus;
