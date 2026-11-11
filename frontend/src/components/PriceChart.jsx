import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { money } from '../utils.js';

const time = (t) =>
  new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function PriceChart({ history, up }) {
  const color = up ? '#00a884' : '#e5533d';
  const prices = history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.15 || 1;

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="recorded_at" tickFormatter={time} tick={{ fontSize: 11, fill: '#8a94a6' }} minTickGap={60} axisLine={false} tickLine={false} />
          <YAxis domain={[min - pad, max + pad]} tickFormatter={(v) => Math.round(v)} tick={{ fontSize: 11, fill: '#8a94a6' }} width={48} axisLine={false} tickLine={false} orientation="right" />
          <Tooltip
            formatter={(v) => [money(v), 'Price']}
            labelFormatter={time}
            contentStyle={{ borderRadius: 8, border: '1px solid #e6e9ef', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#fill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
