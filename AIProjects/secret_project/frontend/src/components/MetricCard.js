import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Tooltip,
    CircularProgress,
    useTheme
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Info as InfoIcon,
    History as HistoryIcon
} from '@mui/icons-material';

const MetricCard = ({
    title,
    value,
    trend,
    icon,
    color = 'primary',
    isLoading = false,
    showHistory = true,
    description,
    formatter = (val) => val,
    onClick
}) => {
    const theme = useTheme();

    const getTrendColor = (trendValue) => {
        if (!trendValue) return theme.palette.text.secondary;
        return trendValue > 0 ? theme.palette.success.main : theme.palette.error.main;
    };

    const getTrendIcon = (trendValue) => {
        if (!trendValue) return null;
        return trendValue > 0 ? (
            <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
        ) : (
            <TrendingDownIcon sx={{ color: theme.palette.error.main }} />
        );
    };

    const formatTrend = (trendValue) => {
        if (!trendValue) return '';
        const sign = trendValue > 0 ? '+' : '';
        return `${sign}${trendValue}%`;
    };

    return (
        <Card
            sx={{
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                } : {}
            }}
            onClick={onClick}
        >
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography
                            variant="subtitle2"
                            color="textSecondary"
                            gutterBottom
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                            {title}
                            {description && (
                                <Tooltip title={description}>
                                    <InfoIcon fontSize="small" color="action" />
                                </Tooltip>
                            )}
                        </Typography>
                        <Box display="flex" alignItems="baseline" gap={1}>
                            {isLoading ? (
                                <CircularProgress size={20} />
                            ) : (
                                <>
                                    <Typography variant="h4" component="div" color={`${color}.main`}>
                                        {formatter(value)}
                                    </Typography>
                                    {trend !== undefined && (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            {getTrendIcon(trend)}
                                            <Typography
                                                variant="body2"
                                                sx={{ color: getTrendColor(trend) }}
                                            >
                                                {formatTrend(trend)}
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                        {showHistory && (
                            <Tooltip title="View History">
                                <IconButton size="small" color="inherit">
                                    <HistoryIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Box
                            sx={{
                                bgcolor: `${color}.light`,
                                borderRadius: '50%',
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {icon}
                        </Box>
                    </Box>
                </Box>

                {/* Sparkline or Mini Chart could go here */}
                <Box mt={2} height={40}>
                    {/* Add Sparkline component here if needed */}
                </Box>

                {/* Additional Metrics */}
                <Box
                    mt={2}
                    display="flex"
                    justifyContent="space-between"
                    sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}
                >
                    <Tooltip title="Previous Period">
                        <Typography variant="caption" color="textSecondary">
                            Prev: {formatter(value - (value * (trend || 0) / 100))}
                        </Typography>
                    </Tooltip>
                    <Tooltip title="Target">
                        <Typography variant="caption" color="textSecondary">
                            Target: {formatter(value * 1.1)}
                        </Typography>
                    </Tooltip>
                </Box>
            </CardContent>
        </Card>
    );
};

// Predefined formatters for common use cases
export const formatters = {
    number: (value) => new Intl.NumberFormat().format(value),
    currency: (value) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value),
    percentage: (value) => `${value}%`,
    decimal: (value) => value.toFixed(2),
    compact: (value) => new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short'
    }).format(value)
};

// Predefined color schemes for different metric types
export const metricColors = {
    revenue: 'success',
    users: 'primary',
    conversion: 'info',
    performance: 'warning',
    error: 'error'
};

// Example usage:
// <MetricCard
//   title="Revenue"
//   value={1234567}
//   trend={12.5}
//   icon={<AttachMoneyIcon />}
//   color={metricColors.revenue}
//   formatter={formatters.currency}
//   description="Total revenue for the current period"
// />

export default MetricCard;
