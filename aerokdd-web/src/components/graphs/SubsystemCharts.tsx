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
            innerRadius={52}
            outerRadius={82}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
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
          <CartesianGrid strokeDasharray="2 2" stroke="#e4e4e7" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#71717a' }} />
          <Tooltip />
          <Bar dataKey="value" name="Éléments" radius={[0, 0, 0, 0]}>
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
          <CartesianGrid strokeDasharray="2 2" stroke="#e4e4e7" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis
            type="category"
            dataKey="name"
            width={185}
            tick={{ fontSize: 11, fill: '#09090b' }}
          />
          <Tooltip />
          <Bar dataKey="value" name="Éléments" radius={[0, 0, 0, 0]} barSize={18}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
