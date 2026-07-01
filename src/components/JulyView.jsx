import React from 'react'
import { TARGETS, todayStr } from '../data/initialData.js'
import { yen } from '../utils/calc.js'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

const JULY = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1
  const date = `2026-07-${String(d).padStart(2, '0')}`
  const dow = new Date(date + 'T00:00:00').getDay()
  return { d, date, dow }
})

const NAME_W = 62
const DAY_W = 30
const SUM_W = 66

export default function JulyView({ state }) {
  const today = todayStr()
  const uberMonthly = state.targets?.uberMonthlyYen ?? TARGETS.uberMonthlyYen
  const uberDaily = Math.round(uberMonthly / (TARGETS.uberDaysPerMonth || 20))

  const metricOf = (date) => state.metrics?.find(m => m.date === date)

  // 各行の定義：cell(day) → { text, color }、total → 月計テキスト
  const rows = [
    {
      key: 'uber',
      label: 'Uber',
      color: 'var(--gold2)',
      cell: ({ date }) => {
        const m = metricOf(date)
        const v = m?.uberSales != null && m.uberSales !== '' ? Number(m.uberSales) : null
        if (v === null) return { text: '', color: 'var(--text3)' }
        return { text: Math.round(v / 1000) + 'k', color: v >= uberDaily ? 'var(--green)' : 'var(--red)', title: yen(v) }
      },
      total: () => {
        const sum = (state.metrics || []).filter(m => m.date.startsWith('2026-07') && m.uberSales)
          .reduce((s, m) => s + Number(m.uberSales), 0)
        return yen(sum)
      },
    },
    {
      key: 'study',
      label: '宅建',
      color: 'var(--accent)',
      cell: ({ date }) => {
        const m = metricOf(date)
        const min = m?.studyMin != null && m.studyMin !== '' ? Number(m.studyMin) : null
        if (min === null) return { text: '', color: 'var(--text3)' }
        const h = Math.round(min / 6) / 10
        return { text: h + 'h', color: h >= TARGETS.studyHoursPerDay ? 'var(--green)' : 'var(--text)' }
      },
      total: () => {
        const min = (state.metrics || []).filter(m => m.date.startsWith('2026-07') && m.studyMin)
          .reduce((s, m) => s + Number(m.studyMin), 0)
        return (Math.round(min / 6) / 10) + 'h'
      },
    },
    {
      key: 'workout',
      label: '筋トレ',
      color: 'var(--green)',
      cell: ({ date }) => mark(state.days[date], 'tasks', 'workout'),
      total: () => countDays(state.days, d => d.tasks?.workout) + '日',
    },
    {
      key: 'fx',
      label: 'FX',
      color: 'var(--blue)',
      cell: ({ date }) => mark(state.days[date], 'tasks', 'fx'),
      total: () => countDays(state.days, d => d.tasks?.fx) + '日',
    },
    {
      key: 'no-smoke',
      label: '禁煙',
      color: 'var(--red)',
      cell: ({ date }) => {
        const val = state.days[date]?.avoid?.['no-smoke']
        if (val === true) return { text: '✓', color: 'var(--green)' }
        if (val === false) return { text: '✗', color: 'var(--red)' }
        return { text: '', color: 'var(--text3)' }
      },
      total: () => countDays(state.days, d => d.avoid?.['no-smoke'] === true) + '日',
    },
  ]

  return (
    <>
      <div className="section-header">7月 まるごと（横スクロール →）</div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 0 24px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{
                ...stickyLeft, top: 0, zIndex: 3,
                width: NAME_W, minWidth: NAME_W,
                background: 'var(--bg3)', borderBottom: '2px solid var(--border2)',
                fontSize: 11, color: 'var(--text2)',
              }}>7月</th>
              {JULY.map(({ d, dow, date }) => {
                const isToday = date === today
                return (
                  <th key={d} style={{
                    width: DAY_W, minWidth: DAY_W,
                    padding: '4px 0', lineHeight: 1.15,
                    background: isToday ? 'var(--blue-dim)' : 'var(--bg3)',
                    borderBottom: '2px solid var(--border2)',
                    borderLeft: '1px solid var(--border)',
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{d}</div>
                    <div style={{ fontSize: 9, color: dow === 0 ? 'var(--red)' : dow === 6 ? 'var(--blue)' : 'var(--text3)' }}>{DOW[dow]}</div>
                  </th>
                )
              })}
              <th style={{
                width: SUM_W, minWidth: SUM_W,
                background: 'var(--bg3)', borderBottom: '2px solid var(--border2)',
                borderLeft: '2px solid var(--border2)',
                fontSize: 10, color: 'var(--text2)',
              }}>月計</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key}>
                <td style={{
                  ...stickyLeft, zIndex: 1,
                  width: NAME_W, minWidth: NAME_W,
                  padding: '6px 6px', textAlign: 'left', fontWeight: 600,
                  color: row.color, background: 'var(--bg2)',
                  borderBottom: '1px solid var(--border)',
                }}>{row.label}</td>
                {JULY.map(({ d, date, dow }) => {
                  const isToday = date === today
                  const { text, color, title } = row.cell({ date })
                  const bg = isToday ? 'var(--blue-dim)' : dow === 0 ? '#fff5f5' : dow === 6 ? '#f0f5ff' : 'var(--bg2)'
                  return (
                    <td key={d} title={title} style={{
                      width: DAY_W, minWidth: DAY_W,
                      padding: '6px 0', textAlign: 'center',
                      color, background: bg, fontWeight: 600,
                      borderBottom: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border)',
                    }}>{text || '·'}</td>
                  )
                })}
                <td style={{
                  width: SUM_W, minWidth: SUM_W,
                  padding: '6px 4px', textAlign: 'center',
                  fontWeight: 700, color: row.color,
                  background: 'var(--bg3)',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: '2px solid var(--border2)',
                }}>{row.total()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ margin: '0 16px', color: 'var(--text3)', fontSize: 11, lineHeight: 1.7 }}>
        Uber・宅建は「記録」タブ、筋トレ・FX・禁煙は「今日」タブで入力すると自動で反映されます。<br />
        <span style={{ color: 'var(--green)' }}>緑=目標達成 / ✓</span>・<span style={{ color: 'var(--red)' }}>赤=未達 / ✗</span>・<span style={{ color: 'var(--text3)' }}>· =未記録</span>
      </div>
    </>
  )
}

const stickyLeft = {
  position: 'sticky',
  left: 0,
  boxShadow: '2px 0 0 var(--border)',
}

function mark(dayLog, group, id) {
  if (!dayLog) return { text: '', color: 'var(--text3)' }
  const done = !!dayLog[group]?.[id]
  return done
    ? { text: '✓', color: 'var(--green)' }
    : { text: '✗', color: 'var(--red)' }
}

function countDays(days, pred) {
  return Object.entries(days || {})
    .filter(([date]) => date.startsWith('2026-07'))
    .filter(([, log]) => pred(log)).length
}
