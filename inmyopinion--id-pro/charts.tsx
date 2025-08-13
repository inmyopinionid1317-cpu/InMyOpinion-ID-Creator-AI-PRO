/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ChartData {
    label: string;
    value: number;
}

export const BarChart = ({ data, title }: { data: ChartData[]; title: string }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value), 0);
    const containerHeight = 300;
    const barAreaHeight = 250;
    const barWidth = 60;
    const barMargin = 20;
    const svgWidth = data.length * (barWidth + barMargin);

    const formatValue = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toLocaleString();
    };

    return (
        <div className="chart-container">
            <h4 className="chart-title">{title}</h4>
            <div className="bar-chart-svg-wrapper">
                <svg width={svgWidth} height={containerHeight} className="bar-chart">
                    {data.map((d, i) => {
                        const barHeight = maxValue > 0 ? (d.value / maxValue) * barAreaHeight : 0;
                        const x = i * (barWidth + barMargin);
                        const y = barAreaHeight - barHeight;
                        const label = d.label.length > 25 ? `${d.label.substring(0, 22)}...` : d.label;

                        const isValueInside = barHeight > 25;
                        const valueY = isValueInside ? y + 20 : y - 8;
                        const valueColor = isValueInside ? 'var(--text-primary)' : 'var(--text-secondary)';

                        return (
                            <g key={i}>
                                <title>{d.label}: {d.value.toLocaleString()}</title>
                                <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" ry="4" className="bar" />
                                <text x={x + barWidth / 2} y={barAreaHeight + 20} className="bar-label">{label}</text>
                                {d.value > 0 && (
                                    <text x={x + barWidth / 2} y={valueY} className="bar-value" fill={valueColor}>
                                        {formatValue(d.value)}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};


export const LineChart = ({ data }: { data: ChartData[] }) => {
    if (!data || data.length < 2) {
        return <div className="dashboard-empty-state">Data tidak cukup untuk menampilkan grafik.</div>;
    }

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero, min value of 1 for scale
    const getX = (index: number) => margin.left + (index / (data.length - 1)) * chartWidth;
    const getY = (value: number) => margin.top + chartHeight - (value / maxValue) * chartHeight;

    const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

    const yAxisValues = [0, Math.ceil(maxValue / 2), maxValue];

    return (
        <div className="line-chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" preserveAspectRatio="xMidYMid meet">
                {/* Y-axis grid lines and labels */}
                {yAxisValues.map(val => (
                    <g key={`y-grid-${val}`}>
                        <path d={`M ${margin.left} ${getY(val)} H ${width - margin.right}`} className="grid" />
                        <text x={margin.left - 8} y={getY(val) + 4} className="y-axis-label axis-label">{val}</text>
                    </g>
                ))}
                
                {/* X-axis labels */}
                {data.map((d, i) => (
                    <text key={`x-label-${i}`} x={getX(i)} y={height - margin.bottom + 15} className="x-axis-label axis-label">
                        {d.label}
                    </text>
                ))}

                {/* Main line path */}
                <path d={pathData} className="line" />

                {/* Points on the line */}
                {data.map((d, i) => (
                    <g key={`point-group-${i}`}>
                        <title>{d.label}: {d.value}</title>
                        <circle cx={getX(i)} cy={getY(d.value)} r="4" className="point" />
                    </g>
                ))}
            </svg>
        </div>
    );
};