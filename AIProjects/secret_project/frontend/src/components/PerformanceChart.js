import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    ButtonGroup,
    Button,
    IconButton,
    Tooltip,
    CircularProgress,
    useTheme
} from '@mui/material';
import {
    Settings as SettingsIcon,
    FileDownload as DownloadIcon,
    Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    Label
} from 'recharts';

const PerformanceChart = ({
    data,
    title,
    isLoading = false,
    timeRange = '7d',
    metrics = ['revenue', 'orders', 'conversion'],
    height = 400
}) => {
    const theme = useTheme();
    const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
    const [selectedMetrics, setSelectedMetrics] = useState(metrics);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Process and format data based on selected time range and metrics
        if (data) {
            const processedData = processChartData(data, selectedTimeRange);
            setChartData(processedData);
        }
    }, [data, selectedTimeRange]);

    const timeRangeOptions = [
        { value: '24h', label: '24H' },
        { value: '7d', label: '7D' },
        { value: '30d', label: '30D' },
        { value: '90d', label: '90D' }
    ];

    const metricColors = {
        revenue: theme.palette.primary.main,
        orders: theme.palette.secondary.main,
        conversion: theme.palette.success.main,
        visitors: theme.palette.info.main,
        avgOrderValue: theme.palette.warning.main
    };

    const formatValue = (value, metric) => {
        switch (metric) {
            case 'revenue':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(value);
            case 'conversion':
                return `${value.toFixed(2)}%`;
            default:
                return new Intl.NumberFormat().format(value);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload) return null;

        return (
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }}
            >
                <Typography variant="subtitle2" gutterBottom>
                    {new Date(label).toLocaleDateString()}
                </Typography>
                {payload.map((entry, index) => (
                    <Box key={index} sx={{ color: entry.color }}>
                        <Typography variant="caption">
                            {entry.name}: {formatValue(entry.value, entry.name)}
                        </Typography>
                    </Box>
                ))}
            </Paper>
        );
    };

    return (
        <Paper elevation={2}>
            <Box p={2}>
                {/* Chart Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="h2">
                        {title}
                    </Typography>
                    <Box display="flex" gap={1}>
                        <ButtonGroup size="small">
                            {timeRangeOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    variant={selectedTimeRange === option.value ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedTimeRange(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </ButtonGroup>
                        <Tooltip title="Download Data">
                            <IconButton size="small">
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Chart Settings">
                            <IconButton size="small">
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Fullscreen">
                            <IconButton size="small">
                                <FullscreenIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Chart Container */}
                <Box height={height} position="relative">
                    {isLoading ? (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            height="100%"
                        >
                            <CircularProgress />
                        </Box>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                                />
                                <YAxis yAxisId="left">
                                    <Label
                                        value="Revenue"
                                        angle={-90}
                                        position="insideLeft"
                                        style={{ textAnchor: 'middle' }}
                                    />
                                </YAxis>
                                <YAxis yAxisId="right" orientation="right">
                                    <Label
                                        value="Orders"
                                        angle={90}
                                        position="insideRight"
                                        style={{ textAnchor: 'middle' }}
                                    />
                                </YAxis>
                                <ChartTooltip content={<CustomTooltip />} />
                                <Legend />

                                {selectedMetrics.includes('revenue') && (
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke={metricColors.revenue}
                                        yAxisId="left"
                                        dot={false}
                                    />
                                )}
                                {selectedMetrics.includes('orders') && (
                                    <Bar
                                        dataKey="orders"
                                        fill={metricColors.orders}
                                        yAxisId="right"
                                    />
                                )}
                                {selectedMetrics.includes('conversion') && (
                                    <Area
                                        type="monotone"
                                        dataKey="conversion"
                                        fill={metricColors.conversion}
                                        stroke={metricColors.conversion}
                                        fillOpacity={0.3}
                                        yAxisId="right"
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </Box>

                {/* Chart Footer */}
                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" gap={2}>
                        {Object.entries(metricColors).map(([metric, color]) => (
                            <Box
                                key={metric}
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                                sx={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setSelectedMetrics(prev =>
                                        prev.includes(metric)
                                            ? prev.filter(m => m !== metric)
                                            : [...prev, metric]
                                    );
                                }}
                            >
                                <Box
                                    width={12}
                                    height={12}
                                    bgcolor={color}
                                    borderRadius="50%"
                                    opacity={selectedMetrics.includes(metric) ? 1 : 0.3}
                                />
                                <Typography
                                    variant="caption"
                                    color={selectedMetrics.includes(metric) ? 'textPrimary' : 'textSecondary'}
                                >
                                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                        Last updated: {new Date().toLocaleString()}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

// Helper function to process chart data
const processChartData = (data, timeRange) => {
    // Implementation would depend on data format
    return data;
};

export default PerformanceChart;
