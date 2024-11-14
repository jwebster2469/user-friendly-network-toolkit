import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Button,
    Collapse,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Badge,
    Divider
} from '@mui/material';
import {
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Delete as DeleteIcon,
    Done as DoneIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';

const AlertsPanel = ({ alerts = [] }) => {
    const [expanded, setExpanded] = useState({});
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filter, setFilter] = useState('all');

    const handleExpandClick = (id) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleAlertClick = (alert) => {
        setSelectedAlert(alert);
        setIsDialogOpen(true);
    };

    const getAlertIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <ErrorIcon color="error" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'success':
                return <CheckCircleIcon color="success" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    const getAlertColor = (severity) => {
        switch (severity) {
            case 'critical':
                return 'error';
            case 'warning':
                return 'warning';
            case 'success':
                return 'success';
            default:
                return 'info';
        }
    };

    const filterAlerts = (alerts) => {
        if (filter === 'all') return alerts;
        return alerts.filter(alert => alert.severity === filter);
    };

    return (
        <Paper elevation={2}>
            <Box p={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Badge badgeContent={alerts.length} color="error">
                            <NotificationsIcon />
                        </Badge>
                        <Typography variant="h6" component="h2">
                            System Alerts & Notifications
                        </Typography>
                    </Box>
                    <Box>
                        <Tooltip title="Filter Alerts">
                            <IconButton onClick={() => {}}>
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Alert Settings">
                            <IconButton onClick={() => {}}>
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Alert Statistics */}
                <Box display="flex" gap={2} mb={2}>
                    <Chip
                        icon={<ErrorIcon />}
                        label={`${alerts.filter(a => a.severity === 'critical').length} Critical`}
                        color="error"
                        variant="outlined"
                        onClick={() => setFilter('critical')}
                    />
                    <Chip
                        icon={<WarningIcon />}
                        label={`${alerts.filter(a => a.severity === 'warning').length} Warnings`}
                        color="warning"
                        variant="outlined"
                        onClick={() => setFilter('warning')}
                    />
                    <Chip
                        icon={<InfoIcon />}
                        label={`${alerts.filter(a => a.severity === 'info').length} Info`}
                        color="info"
                        variant="outlined"
                        onClick={() => setFilter('info')}
                    />
                </Box>

                <List>
                    {filterAlerts(alerts).map((alert) => (
                        <React.Fragment key={alert.id}>
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    bgcolor: alert.read ? 'transparent' : 'action.hover',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <ListItemIcon>
                                    {getAlertIcon(alert.severity)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="subtitle1">
                                                {alert.title}
                                            </Typography>
                                            <Chip
                                                label={alert.category}
                                                size="small"
                                                color={getAlertColor(alert.severity)}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" color="text.primary">
                                                {alert.description}
                                            </Typography>
                                            <Box mt={1} display="flex" gap={1}>
                                                <Chip
                                                    label={alert.source}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(alert.timestamp).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </>
                                    }
                                    onClick={() => handleAlertClick(alert)}
                                    sx={{ cursor: 'pointer' }}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleExpandClick(alert.id)}
                                    >
                                        {expanded[alert.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            <Collapse in={expanded[alert.id]} timeout="auto" unmountOnExit>
                                <Box p={2} bgcolor="background.default">
                                    <Typography variant="subtitle2" gutterBottom>
                                        Additional Information
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        {alert.details}
                                    </Typography>
                                    <Box display="flex" justifyContent="flex-end" gap={1}>
                                        <Button
                                            startIcon={<DoneIcon />}
                                            size="small"
                                            variant="outlined"
                                        >
                                            Mark as Resolved
                                        </Button>
                                        <Button
                                            startIcon={<DeleteIcon />}
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                        >
                                            Dismiss
                                        </Button>
                                    </Box>
                                </Box>
                            </Collapse>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>

                {/* Alert Details Dialog */}
                <Dialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            {selectedAlert && getAlertIcon(selectedAlert.severity)}
                            {selectedAlert?.title}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {selectedAlert && (
                            <>
                                <Typography variant="body1" paragraph>
                                    {selectedAlert.description}
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>
                                    Impact Analysis
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    {selectedAlert.impact}
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>
                                    Recommended Actions
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    {selectedAlert.recommendations}
                                </Typography>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Take Action
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Paper>
    );
};

export default AlertsPanel;
