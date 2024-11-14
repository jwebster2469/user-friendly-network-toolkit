import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Button,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    ShowChart as ShowChartIcon,
    Timeline as TimelineIcon,
    Psychology as PsychologyIcon,
    Lightbulb as LightbulbIcon,
    AutoGraph as AutoGraphIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const AIInsightsPanel = ({ insights }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleGenerateInsights = async () => {
        setIsGenerating(true);
        try {
            // Simulate AI processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            // In real implementation, call AI service here
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Paper elevation={2}>
            <Box p={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="h2">
                        AI Insights & Recommendations
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                        onClick={handleGenerateInsights}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Analyzing...' : 'Generate Insights'}
                    </Button>
                </Box>

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 2 }}
                >
                    <Tab label="Market Trends" icon={<TrendingUpIcon />} />
                    <Tab label="Price Optimization" icon={<ShowChartIcon />} />
                    <Tab label="Performance Predictions" icon={<TimelineIcon />} />
                    <Tab label="Opportunities" icon={<LightbulbIcon />} />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                    <MarketTrendsContent insights={insights?.marketTrends} />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    <PriceOptimizationContent insights={insights?.priceOptimization} />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    <PredictionsContent insights={insights?.predictions} />
                </TabPanel>
                <TabPanel value={activeTab} index={3}>
                    <OpportunitiesContent insights={insights?.opportunities} />
                </TabPanel>
            </Box>
        </Paper>
    );
};

const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
        {value === index && <Box>{children}</Box>}
    </div>
);

const MarketTrendsContent = ({ insights }) => (
    <List>
        {insights?.trends?.map((trend, index) => (
            <ListItem key={index} alignItems="flex-start">
                <ListItemIcon>
                    <AutoGraphIcon color={trend.sentiment === 'positive' ? 'success' : 'error'} />
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box display="flex" alignItems="center">
                            {trend.title}
                            <Chip
                                label={`${trend.confidence}% confidence`}
                                size="small"
                                color={trend.confidence > 75 ? 'success' : 'warning'}
                                sx={{ ml: 1 }}
                            />
                        </Box>
                    }
                    secondary={
                        <>
                            <Typography variant="body2" color="text.primary">
                                {trend.description}
                            </Typography>
                            <Box mt={1}>
                                {trend.tags.map((tag, i) => (
                                    <Chip
                                        key={i}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                ))}
                            </Box>
                        </>
                    }
                />
                <Tooltip title="View Details">
                    <IconButton size="small">
                        <InfoIcon />
                    </IconButton>
                </Tooltip>
            </ListItem>
        ))}
    </List>
);

const PriceOptimizationContent = ({ insights }) => (
    <List>
        {insights?.recommendations?.map((rec, index) => (
            <ListItem key={index}>
                <ListItemIcon>
                    <ShowChartIcon color={rec.impact === 'high' ? 'success' : 'info'} />
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box display="flex" alignItems="center">
                            {rec.title}
                            <Chip
                                label={`${rec.potentialIncrease}% potential increase`}
                                size="small"
                                color="success"
                                sx={{ ml: 1 }}
                            />
                        </Box>
                    }
                    secondary={rec.reasoning}
                />
            </ListItem>
        ))}
    </List>
);

const PredictionsContent = ({ insights }) => (
    <List>
        {insights?.forecasts?.map((forecast, index) => (
            <ListItem key={index}>
                <ListItemIcon>
                    <TimelineIcon color={forecast.trend === 'up' ? 'success' : 'error'} />
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box display="flex" alignItems="center">
                            {forecast.metric}
                            <Chip
                                label={`${forecast.accuracy}% accuracy`}
                                size="small"
                                color={forecast.accuracy > 80 ? 'success' : 'warning'}
                                sx={{ ml: 1 }}
                            />
                        </Box>
                    }
                    secondary={
                        <>
                            <Typography variant="body2" color="text.primary">
                                Predicted: {forecast.prediction}
                            </Typography>
                            <Typography variant="body2">
                                Confidence Interval: {forecast.confidenceInterval}
                            </Typography>
                        </>
                    }
                />
            </ListItem>
        ))}
    </List>
);

const OpportunitiesContent = ({ insights }) => (
    <List>
        {insights?.opportunities?.map((opportunity, index) => (
            <ListItem key={index}>
                <ListItemIcon>
                    <LightbulbIcon color={opportunity.priority === 'high' ? 'warning' : 'info'} />
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box display="flex" alignItems="center">
                            {opportunity.title}
                            <Chip
                                label={opportunity.priority}
                                size="small"
                                color={opportunity.priority === 'high' ? 'error' : 'info'}
                                sx={{ ml: 1 }}
                            />
                        </Box>
                    }
                    secondary={
                        <>
                            <Typography variant="body2" color="text.primary">
                                {opportunity.description}
                            </Typography>
                            <Box mt={1}>
                                <Chip
                                    label={`ROI: ${opportunity.estimatedRoi}`}
                                    size="small"
                                    color="success"
                                    sx={{ mr: 1 }}
                                />
                                <Chip
                                    label={`Effort: ${opportunity.implementationEffort}`}
                                    size="small"
                                    color="primary"
                                />
                            </Box>
                        </>
                    }
                />
            </ListItem>
        ))}
    </List>
);

export default AIInsightsPanel;
