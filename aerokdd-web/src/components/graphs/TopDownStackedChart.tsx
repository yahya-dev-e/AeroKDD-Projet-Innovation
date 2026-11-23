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

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E4E4E7',
  borderRadius: '2px',
  boxShadow: 'none',
  fontSize: '11px',
  fontFamily: 'JetBrains Mono, monospace',
  color: '#09090B',
}

export function TopDownStackedChart({ data }: { data: SubsystemTopDownSummary[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
        >
          <CartesianGrid stroke="#D4D4D8" strokeOpacity={0.55} strokeDasharray="2 2" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={{ stroke: '#D4D4D8' }}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <YAxis
            type="category"
            dataKey="subsystem"
            width={92}
            axisLine={{ stroke: '#D4D4D8' }}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: '#09090B',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#FAFAFA' }} />
          <Legend
            wrapperStyle={{
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#52525B',
            }}
          />
          <Bar
            dataKey="directCount"
            name="Direct (Niv 1)"
            stackId="a"
            fill="#09090B"
            radius={[0, 0, 0, 0]}
            barSize={16}
          />
          <Bar
            dataKey="indirectCount"
            name="Indirect (Niv 2)"
            stackId="a"
            fill="#D4D4D8"
            stroke="#52525B"
            strokeWidth={0.5}
            radius={[0, 0, 0, 0]}
            barSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
