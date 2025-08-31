import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface UserGrowthData {
  month: string;
  users: number;
}

interface RegionData {
  region: string;
  users: number;
  percentage: number;
}

interface FileTypeData {
  type: string;
  count: number;
  percentage: number;
}

interface UploadTrendData {
  month: string;
  uploads: number;
}

interface UserGrowthChartProps {
  data: UserGrowthData[];
}

interface RegionChartProps {
  data: RegionData[];
}

interface FileTypeChartProps {
  data: FileTypeData[];
}

interface UploadTrendChartProps {
  data: UploadTrendData[];
}

// Color palettes for charts - updated to match admin panel theme
const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  accent: '#4ade80',
  danger: '#ff6b6b',
  purple: '#a855f7',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  orange: '#f97316',
  yellow: '#eab308'
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.pink, COLORS.indigo, COLORS.teal, COLORS.orange, COLORS.yellow];

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        fontStyle: 'italic'
      }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis 
          dataKey="month" 
          stroke="rgba(255, 255, 255, 0.7)"
          fontSize={12}
          tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
        />
        <YAxis 
          stroke="rgba(255, 255, 255, 0.7)"
          fontSize={12}
          tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            backdropFilter: 'blur(20px)'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="users" 
          stroke={COLORS.accent}
          fill={COLORS.accent}
          fillOpacity={0.3}
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const RegionChart: React.FC<RegionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        fontStyle: 'italic'
      }}>
        No regional data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis 
          dataKey="region" 
          stroke="rgba(255, 255, 255, 0.7)"
          fontSize={12}
          tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
        />
        <YAxis 
          stroke="rgba(255, 255, 255, 0.7)"
          fontSize={12}
          tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            backdropFilter: 'blur(20px)'
          }}
        />
        <Bar 
          dataKey="users" 
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const FileTypeChart: React.FC<FileTypeChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        fontStyle: 'italic'
      }}>
        No file type data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            backdropFilter: 'blur(20px)'
          }}
        />
        <Legend 
          wrapperStyle={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const UploadTrendChart: React.FC<UploadTrendData> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        fontStyle: 'italic'
      }}>
        No upload trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis 
          dataKey="month" 
          stroke="rgba(255, 255, 255, 0.7)"
          fontSize={12}
          tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
        />
        <YAxis 
          stroke="rgba(255, 255, 255, 0.7)"
          fontSize={12}
          tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            backdropFilter: 'blur(20px)'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="uploads" 
          stroke={COLORS.secondary}
          strokeWidth={3}
          dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8, stroke: COLORS.secondary, strokeWidth: 2, fill: COLORS.secondary }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};