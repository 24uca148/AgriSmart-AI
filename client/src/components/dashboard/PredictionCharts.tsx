import { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';
import type { PredictionsListResponse } from '@shared/schema';
import { useLanguage } from '@/lib/i18n';
import { translatePestRisk } from '@/lib/predictionTranslations';

interface PredictionChartsProps {
  predictions: PredictionsListResponse;
}

const PEST_COLORS = {
  Low: 'hsl(142 70% 40%)',
  Medium: 'hsl(38 92% 50%)',
  High: 'hsl(0 84% 60%)'
};

export function PredictionCharts({ predictions }: PredictionChartsProps) {
  const { t, language } = useLanguage();
  
  // Format data for Yield over time chart
  const yieldData = useMemo(() => {
    // Sort chronologically and take last 20 for readability
    return [...predictions]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-20)
      .map(p => ({
        date: format(new Date(p.createdAt), 'MMM dd, HH:mm'),
        yield: Number(p.yieldPrediction.toFixed(2)),
        crop: p.cropRecommendation
      }));
  }, [predictions]);

  // Aggregate data for Pest Risk Distribution Pie Chart
  const pestRiskData = useMemo(() => {
    const counts = predictions.reduce((acc, curr) => {
      const risk = curr.pestRisk as keyof typeof PEST_COLORS;
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [predictions]);

  if (!predictions.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Yield Trend Line Chart */}
      <div id="report-yield-trend-chart" className="lg:col-span-2 glass-panel rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold font-display text-foreground">{t("yieldTrend")}</h3>
          <p className="text-sm text-muted-foreground">{t("yieldTrendSub")}</p>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yieldData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dx={-10}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              />
              <Line 
                type="monotone" 
                dataKey="yield" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pest Risk Pie Chart */}
      <div id="report-pest-risk-chart" className="glass-panel rounded-2xl p-6 flex flex-col">
        <div className="mb-2">
          <h3 className="text-lg font-bold font-display text-foreground">{t("pestRiskDistribution")}</h3>
          <p className="text-sm text-muted-foreground">{t("pestRiskDistSub")}</p>
        </div>
        
        <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pestRiskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1000}
              >
                {pestRiskData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PEST_COLORS[entry.name as keyof typeof PEST_COLORS] || 'hsl(var(--muted))'} 
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ 
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ fontWeight: 600 }}
                formatter={(value: number, name: string) => [value, translatePestRisk(name, language)]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value: string) => translatePestRisk(value, language)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
