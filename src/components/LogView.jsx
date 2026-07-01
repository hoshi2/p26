import React from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { catColor, todayStr } from '../data/initialData.js'
import { numberSeries, monthSum, yen, habitsForMonth } from '../utils/calc.js'

// 色を実際の値に解決（rechartsはCSS変数を解釈できないため）
const HEX = {
  'var(--gold)': '#b8893a', 'var(--blue)': '#2f6fed',
  'var(--green)': '#2f9e6f', 'var(--accent)': '#6a5cf0', 'var(--text3)': '#8a92a6',
}

export default function LogView({ state }) {
  const days = state.days || {}
  const numberHabits = habitsForMonth(state, todayStr().slice(0, 7)).filter(h => h.type === 'number')

  return (
    <>
      <div className="section-header">推移グラフ</div>
      {numberHabits.length === 0 && (
        <div className="chart-empty">「数字で記録」する項目を設定タブで追加するとグラフが出ます</div>
      )}

      {numberHabits.map(h => {
        const data = numberSeries(days, h.id)
        const color = HEX[catColor(h.cat)] || '#2f6fed'
        const total = monthSum(days, h.id)
        const isYen = h.unit === '円'
        const useBar = isYen
        return (
          <div key={h.id}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{h.name}{h.unit ? `（${h.unit}）` : ''}</span>
              <span style={{ color: 'var(--text2)', textTransform: 'none', letterSpacing: 0 }}>
                今月計 {isYen ? yen(total) : total + (h.unit || '')}
              </span>
            </div>
            {data.length >= 2 ? (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={170}>
                  {useBar ? (
                    <BarChart data={data} margin={{ top: 8, right: 20, left: -4, bottom: 0 }}>
                      <CartesianGrid stroke="#e2e7f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} width={44}
                        tickFormatter={v => (v >= 1000 ? (v / 1000) + 'k' : v)} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d2dae6', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#525a6e' }} formatter={v => isYen ? yen(v) : v} />
                      <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={data} margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#e2e7f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d2dae6', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#525a6e' }} formatter={v => v + (h.unit || '')} />
                      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="chart-empty">2日分以上記録するとグラフが出ます</div>
            )}
          </div>
        )
      })}

      <div className="alert alert-blue" style={{ marginTop: 16 }}>
        記録の入力・修正は「習慣」タブのマス目をタップして行います。過去の日付も週を切り替えて直せます。
      </div>
      <div style={{ height: 24 }} />
    </>
  )
}
