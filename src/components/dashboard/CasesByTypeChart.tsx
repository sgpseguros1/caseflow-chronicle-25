import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CASE_TYPE_LABELS, CaseType } from '@/types';

interface CasesByTypeChartProps {
  data: Record<CaseType, number>;
}

const COLORS = {
  DPVAT: 'hsl(222, 47%, 20%)',
  INSS: 'hsl(199, 89%, 48%)',
  VIDA: 'hsl(0, 84%, 60%)',
  VIDA_EMPRESARIAL: 'hsl(38, 92%, 50%)',
  DANOS: 'hsl(142, 71%, 45%)',
  JUDICIAL: 'hsl(270, 50%, 50%)',
};

export function CasesByTypeChart({ data }: CasesByTypeChartProps) {
  const chartData = Object.entries(data).map(([type, value]) => ({
    name: CASE_TYPE_LABELS[type as CaseType],
    value,
    color: COLORS[type as CaseType],
  }));

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
