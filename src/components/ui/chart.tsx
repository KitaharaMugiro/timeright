'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Color palette matching the app's amber/slate theme
export const CHART_COLORS = {
  primary: '#f59e0b', // amber-500
  secondary: '#64748b', // slate-500
  success: '#22c55e', // green-500
  warning: '#eab308', // yellow-500
  danger: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
};

export const PIE_COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#ef4444', // red
];

interface TrendChartProps {
  data: unknown[];
  dataKey: string;
  secondaryDataKey?: string;
  height?: number;
  label?: string;
  secondaryLabel?: string;
}

export function TrendChart({
  data,
  dataKey,
  secondaryDataKey,
  height = 200,
  label,
  secondaryLabel,
}: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
          labelFormatter={(value) => {
            const date = new Date(value);
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        {(label || secondaryLabel) && <Legend />}
        <Line
          type="monotone"
          dataKey={dataKey}
          name={label || dataKey}
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          dot={false}
        />
        {secondaryDataKey && (
          <Line
            type="monotone"
            dataKey={secondaryDataKey}
            name={secondaryLabel || secondaryDataKey}
            stroke={CHART_COLORS.danger}
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface DistributionChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
}

export function DistributionChart({ data, height = 200 }: DistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) =>
            total > 0 && percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : name
          }
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BarChartComponentProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: string;
}

export function BarChartComponent({
  data,
  height = 200,
  color = CHART_COLORS.primary,
}: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
