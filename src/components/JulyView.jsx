import React from 'react'
import { yen } from '../utils/calc.js'
import { TARGETS } from '../data/initialData.js'
import { todayStr } from '../data/initialData.js'

const DAILY_UBER_TARGET = 15000

const JULY_DAYS = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1
  const date = `2026-07-${String(d).padStart(2, '0')}`
  const dow = new Date(date + 'T00:00:00').getDay()
  const DOW = ['日', '月', '火', '水', '木', '金', '土']
  return { date, d, label: `${d}(${DOW[dow]})`, dow }
})

function Mark({ val }) {
  if (val === true) return <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
  if (val === false) return <span style={{ color: 'var(--red)' }}>✗</span>
  return <span style={{ color: 'var(--text3)' }}>—</span>
}

export default function JulyView({ state }) {
  const today = todayStr()
  const noSmoke = state.avoid?.['no-smoke']

  return (
    <>
      <div className="section-header">7月 まるごと確認</div>
      <div style={{ overflowX: 'auto', margin: '0 8px 24px', WebkitOverflowScrolling: 'touch' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: 11,
          tableLayout: 'fixed', minWidth: 340,
        }}>
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '2px solid var(--border2)' }}>
              {['日付', 'Uber', '宅建', '筋トレ', 'FX', '禁煙'].map(h => (
                <th key={h} style={{
                  padding: '7px 3px', textAlign: 'center',
                  color: 'var(--text2)', fontWeight: 600, fontSize: 11,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {JULY_DAYS.map(({ date, d, label, dow }) => {
              const isToday = date === today
              const isFuture = date > today
              const dayLog = state.days[date]
              const metric = state.metrics?.find(m => m.date === date)
              const hasRecord = !!dayLog

              const uberSales = metric?.uberSales != null && metric.uberSales !== ''
                ? Number(metric.uberSales) : null
              const studyMin = metric?.studyMin != null && metric.studyMin !== ''
                ? Number(metric.studyMin) : null
              const studyH = studyMin !== null ? (Math.round(studyMin / 6) / 10) : null

              const workout = hasRecord ? (dayLog.tasks?.workout ? true : false) : null
              const fx = hasRecord ? (dayLog.tasks?.fx ? true : false) : null

              // no-smoke: infer from avoid model
              let smoke = null
              if (!isFuture && noSmoke) {
                if (noSmoke.brokeOn === date) smoke = false
                else if (noSmoke.since && date >= noSmoke.since) smoke = true
              }

              const uberOk = uberSales !== null && uberSales >= DAILY_UBER_TARGET
              const bg = isToday ? 'var(--blue-dim)' : dow === 0 ? '#fff5f5' : dow === 6 ? '#f0f5ff' : 'transparent'

              return (
                <tr key={date} style={{
                  background: bg,
                  borderBottom: '1px solid var(--border)',
                  fontWeight: isToday ? 700 : 400,
                }}>
                  <td style={{ padding: '6px 4px', textAlign: 'center', color: dow === 0 ? 'var(--red)' : dow === 6 ? 'var(--blue)' : 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {label}
                  </td>
                  <td style={{ padding: '6px 3px', textAlign: 'center', color: uberSales === null ? 'var(--text3)' : uberOk ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                    {uberSales !== null ? `¥${uberSales.toLocaleString('ja-JP')}` : '—'}
                  </td>
                  <td style={{ padding: '6px 3px', textAlign: 'center', color: studyH === null ? 'var(--text3)' : studyH >= TARGETS.studyHoursPerDay ? 'var(--green)' : 'var(--text)' }}>
                    {studyH !== null ? `${studyH}h` : '—'}
                  </td>
                  <td style={{ padding: '6px 3px', textAlign: 'center' }}>
                    <Mark val={workout} />
                  </td>
                  <td style={{ padding: '6px 3px', textAlign: 'center' }}>
                    <Mark val={fx} />
                  </td>
                  <td style={{ padding: '6px 3px', textAlign: 'center' }}>
                    <Mark val={smoke} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
