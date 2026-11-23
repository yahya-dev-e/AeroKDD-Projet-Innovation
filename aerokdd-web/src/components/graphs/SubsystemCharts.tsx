import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ChartDatum {
  name: string
  value: number
  color: string
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E4E4E7',
  borderRadius: '2px',
  boxShadow: 'none',
  fontSize: '11px',
  fontFamily: 'JetBrains Mono, monospace',
  color: '#09090B',
}

const AXIS_TICK = {
  fontSize: 11,
  fill: '#52525B',
  fontFamily: 'JetBrains Mono, monospace',
}

export function KsdDonutChart({ data }: { data: ChartDatum[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={54}
            outerRadius={82}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="#FFFFFF" strokeWidth={1.5} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            wrapperStyle={{
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#52525B',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FamilyBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: -12, bottom: 4 }}>
          <CartesianGrid stroke="#D4D4D8" strokeOpacity={0.55} strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={{ stroke: '#D4D4D8' }}
            tickLine={false}
            tick={AXIS_TICK}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#FAFAFA' }} />
          <Bar dataKey="value" name="Éléments" radius={[0, 0, 0, 0]} barSize={28}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatutHorizontalBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
        >
          <CartesianGrid stroke="#D4D4D8" strokeOpacity={0.55} strokeDasharray="2 2" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={{ stroke: '#D4D4D8' }}
            tickLine={false}
            tick={AXIS_TICK}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={185}
            axisLine={{ stroke: '#D4D4D8' }}
            tickLine={false}
            tick={{ fontSize: 10.5, fill: '#09090B', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#FAFAFA' }} />
          <Bar dataKey="value" name="Éléments" radius={[0, 0, 0, 0]} barSize={16}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
