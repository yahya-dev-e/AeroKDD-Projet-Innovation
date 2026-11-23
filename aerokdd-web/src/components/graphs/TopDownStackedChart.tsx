import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SubsystemTopDownSummary } from '../../engines/topDownEngine'

export function TopDownStackedChart({ data }: { data: SubsystemTopDownSummary[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="2 2" stroke="#e4e4e7" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis
            type="category"
            dataKey="subsystem"
            width={92}
            tick={{ fontSize: 11, fill: '#09090b', fontWeight: 600 }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar
            dataKey="directCount"
            name="Direct (Niv 1)"
            stackId="a"
            fill="#09090b"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="indirectCount"
            name="Indirect (Niv 2)"
            stackId="a"
            fill="#a1a1aa"
            radius={[0, 0, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
