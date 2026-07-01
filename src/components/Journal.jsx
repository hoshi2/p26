import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { todayStr } from '../data/initialData.js'
import { weekdayJP } from '../utils/calc.js'

export default function Journal({ state, setState }) {
  const today = todayStr()
  const thisMonth = today.slice(0, 7)
  const journal = state.journal || {}

  const [open, setOpen] = useState({ [thisMonth]: true })

  function setToday(v) {
    setState(prev => {
      const j = { ...(prev.journal || {}) }
      if (v.trim() === '') delete j[today]
      else j[today] = v
      return { ...prev, journal: j }
    })
  }

  // 今日を除いた過去メモを月ごとにまとめる（新しい順）
  const past = Object.entries(journal)
    .filter(([date, text]) => date !== today && String(text).trim() !== '')
    .sort((a, b) => b[0].localeCompare(a[0]))

  const byMonth = {}
  for (const [date, text] of past) {
    const m = date.slice(0, 7)
    ;(byMonth[m] || (byMonth[m] = [])).push({ date, text })
  }
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a))

  function monthLabel(m) {
    const [, mo] = m.split('-')
    return `${Number(mo)}月`
  }
  function dayLabel(date) {
    const d = Number(date.slice(8, 10))
    return `${d}日(${weekdayJP(date)})`
  }

  return (
    <>
      <div className="section-header">頭の中を出す（メモ）</div>
      <div style={{ margin: '6px 16px 0' }}>
        <textarea
          className="memo-area"
          placeholder="今日の気づき・忘れたくないこと。書くと下に日付ごとに溜まっていきます"
          value={journal[today] || ''}
          onChange={e => setToday(e.target.value)}
        />
      </div>

      {months.length > 0 && (
        <>
          <div className="section-header">これまでのメモ</div>
          <div className="jr-list">
            {months.map(m => {
              const items = byMonth[m]
              const isOpen = !!open[m]
              return (
                <div key={m} className="jr-month">
                  <button className="jr-month-head" onClick={() => setOpen(o => ({ ...o, [m]: !o[m] }))}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="jr-month-name">{monthLabel(m)}</span>
                    <span className="jr-month-count">{items.length}件</span>
                  </button>
                  {isOpen && (
                    <div className="jr-entries">
                      {items.map(({ date, text }) => (
                        <div key={date} className="jr-entry">
                          <div className="jr-date">{dayLabel(date)}</div>
                          <div className="jr-text">{text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
