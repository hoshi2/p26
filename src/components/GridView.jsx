import React, { useState, useRef } from 'react'
import { Check, X, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { todayStr, catColor } from '../data/initialData.js'
import { weekdayIdx, dayVal, isDone, dayRate, shortNum, stepFor, habitsForMonth } from '../utils/calc.js'
import Journal from './Journal.jsx'
import '../styles/grid.css'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

export default function GridView({ state, setState }) {
  const today = todayStr()

  // 今月を7日ずつの「週」に区切る
  const monthStr = today.slice(0, 7)
  const habits = habitsForMonth(state, monthStr)
  const [y, mo] = monthStr.split('-').map(Number)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const date = `${monthStr}-${String(d).padStart(2, '0')}`
    return { d, date, dow: weekdayIdx(date) }
  })
  const weeks = []
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7))

  const todayDay = Number(today.slice(8, 10))
  const [week, setWeek] = useState(Math.min(weeks.length - 1, Math.floor((todayDay - 1) / 7)))
  const [edit, setEdit] = useState(null) // { date, habit, value }

  const days = weeks[week] || []
  const first = days[0], last = days[days.length - 1]

  // ---- 値の更新 ----
  function setVal(date, id, value) {
    setState(prev => {
      const daysObj = { ...prev.days }
      const log = { ...(daysObj[date] || { v: {} }) }
      const v = { ...(log.v || {}) }
      if (value === undefined) delete v[id]
      else v[id] = value
      log.v = v
      daysObj[date] = log
      return { ...prev, days: daysObj }
    })
  }

  // check：未 → ✓ → ✗ → 未 を巡回
  function cycleCheck(date, id) {
    const cur = dayVal(state.days, date, id)
    const next = cur === undefined ? true : cur === true ? false : undefined
    setVal(date, id, next)
  }

  function openNumber(date, habit) {
    const cur = dayVal(state.days, date, habit.id)
    setEdit({ date, habit, value: cur != null ? String(cur) : '' })
  }
  function saveNumber() {
    if (!edit) return
    const v = edit.value === '' ? undefined : Number(edit.value)
    setVal(edit.date, edit.habit.id, v)
    setEdit(null)
  }
  function stepEdit(delta) {
    setEdit(e => {
      const cur = Number(e.value || 0)
      const next = Math.max(0, Math.round((cur + delta) * 10) / 10)
      return { ...e, value: String(next) }
    })
  }

  // ---- スワイプで週送り ----
  const touch = useRef(null)
  function onTouchStart(e) { touch.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    if (dx < -45 && week < weeks.length - 1) setWeek(week + 1)
    else if (dx > 45 && week > 0) setWeek(week - 1)
    touch.current = null
  }

  const label = (dd) => `${mo}/${dd.d}`

  return (
    <>
      {/* 週ナビ */}
      <div className="week-nav">
        <button className="week-arrow" onClick={() => setWeek(w => Math.max(0, w - 1))} disabled={week === 0} aria-label="前の週">
          <ChevronLeft size={20} />
        </button>
        <div className="week-title">
          <span className="week-title-main">第{week + 1}週</span>
          <span className="week-title-sub">{first && last ? `${label(first)}〜${label(last)}` : ''}</span>
        </div>
        <button className="week-arrow" onClick={() => setWeek(w => Math.min(weeks.length - 1, w + 1))} disabled={week === weeks.length - 1} aria-label="次の週">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="week-dots">
        {weeks.map((_, i) => (
          <button key={i} className={'week-dot' + (i === week ? ' on' : '')} onClick={() => setWeek(i)} aria-label={`第${i + 1}週`} />
        ))}
        <button className="week-today" onClick={() => setWeek(Math.floor((todayDay - 1) / 7))}>今日へ</button>
      </div>

      {/* グリッド本体 */}
      <div className="grid-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <table className="habit-grid">
          <thead>
            <tr>
              <th className="hg-corner">項目</th>
              {days.map(dd => {
                const isToday = dd.date === today
                return (
                  <th key={dd.d} className={'hg-dayhead' + (isToday ? ' today' : '')}>
                    <div className="hg-daynum">{dd.d}</div>
                    <div className={'hg-dow' + (dd.dow === 0 ? ' sun' : dd.dow === 6 ? ' sat' : '')}>{DOW[dd.dow]}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map(h => (
              <tr key={h.id}>
                <td className="hg-name">
                  <span className="hg-cat" style={{ background: catColor(h.cat) }} />
                  <span className="hg-name-txt">
                    {h.name}
                    <span className="hg-name-sub">
                      {h.type === 'number'
                        ? (h.target ? `目標${h.target}${h.unit || ''}` : (h.unit || '記録'))
                        : (h.hint || '')}
                    </span>
                  </span>
                </td>
                {days.map(dd => {
                  const isToday = dd.date === today
                  const val = dayVal(state.days, dd.date, h.id)
                  const done = isDone(h, val)
                  if (h.type === 'check') {
                    return (
                      <td key={dd.d} className={'hg-cell' + (isToday ? ' today' : '')}>
                        <button
                          className={'hg-check' + (val === true ? ' yes' : val === false ? ' no' : '')}
                          onClick={() => cycleCheck(dd.date, h.id)}
                          aria-label={h.name}
                        >
                          {val === true ? <Check size={15} strokeWidth={3} /> : val === false ? <X size={14} strokeWidth={3} /> : ''}
                        </button>
                      </td>
                    )
                  }
                  return (
                    <td key={dd.d} className={'hg-cell' + (isToday ? ' today' : '')}>
                      <button
                        className={'hg-num' + (val == null || val === '' ? ' empty' : done ? ' ok' : ' miss')}
                        onClick={() => openNumber(dd.date, h)}
                      >
                        {val == null || val === '' ? '＋' : shortNum(h, val)}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* 達成率 */}
            <tr className="hg-rate-row">
              <td className="hg-name"><span className="hg-name-txt" style={{ color: 'var(--text2)' }}>達成率</span></td>
              {days.map(dd => {
                const r = dayRate(state.days, dd.date, habits)
                const has = habits.some(h => dayVal(state.days, dd.date, h.id) !== undefined)
                return (
                  <td key={dd.d} className={'hg-cell' + (dd.date === today ? ' today' : '')}>
                    <span className="hg-rate" style={{ color: !has ? 'var(--text3)' : r === 100 ? 'var(--green)' : r >= 50 ? 'var(--gold2)' : 'var(--red)' }}>
                      {has ? r + '%' : '·'}
                    </span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid-legend">
        タップで記録：<b className="lg-yes">✓</b> やった・<b className="lg-no">✗</b> できなかった・数値はタップして入力。<br />
        項目の追加や名前・目標の変更は「設定」タブでできます。
      </div>

      {/* メモ（日付ごとに溜まる） */}
      <Journal state={state} setState={setState} />
      <div style={{ height: 24 }} />

      {/* 数値入力モーダル */}
      {edit && (
        <div className="modal-back" onClick={() => setEdit(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {edit.habit.name}
              <span className="modal-date">{edit.date.slice(5).replace('-', '/')}</span>
            </div>
            <div className="modal-input-row">
              <button className="chip big" onClick={() => stepEdit(-stepFor(edit.habit))}><Minus size={16} /></button>
              <input
                className="input-field big" type="number" inputMode="decimal" autoFocus
                value={edit.value} placeholder="0"
                onChange={e => setEdit(x => ({ ...x, value: e.target.value }))}
              />
              <span className="modal-unit">{edit.habit.unit}</span>
              <button className="chip big" onClick={() => stepEdit(stepFor(edit.habit))}><Plus size={16} /></button>
            </div>
            <div className="modal-btns">
              <button className="btn btn-ghost" onClick={() => { setVal(edit.date, edit.habit.id, undefined); setEdit(null) }}>クリア</button>
              <button className="btn btn-blue" onClick={saveNumber}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
