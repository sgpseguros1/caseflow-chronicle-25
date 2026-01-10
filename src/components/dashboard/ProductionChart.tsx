import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductionChartProps {
  data: Array<{ name: string; count: number }>;
}

export function ProductionChart({ data }: ProductionChartProps) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            width={80}
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
            }}
            cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
            formatter={(value: number) => [`${value} casos`, 'Quantidade']}
          />
          <Bar 
            dataKey="count" 
            fill="hsl(var(--primary))" 
            radius={[0, 4, 4, 0]} 
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
