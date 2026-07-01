import React, { useState, useRef } from 'react'
import { Check, X, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { todayStr, catColor } from '../data/initialData.js'
import { weekdayIdx, dayVal, isDone, dayRate, shortNum, stepFor, habitsForMonth, checkVal, numVal } from '../utils/calc.js'
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
  const [edit, setEdit] = useState(null) // { date, habit, value, check }

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

  // check（数値なし）：未 → ✓ → ✗ → 未 を巡回
  function cycleCheck(date, id) {
    const cur = dayVal(state.days, date, id)
    const next = cur === undefined ? true : cur === true ? false : undefined
    setVal(date, id, next)
  }

  // 数値／記録／check+数値 の入力モーダルを開く
  function openEdit(date, habit) {
    const raw = dayVal(state.days, date, habit.id)
    const n = numVal(raw)
    setEdit({ date, habit, value: n != null ? String(n) : '', check: checkVal(raw) })
  }
  const combined = edit && edit.habit.type === 'check' && edit.habit.num
  function saveEdit() {
    if (!edit) return
    const n = edit.value === '' ? undefined : Number(edit.value)
    if (combined) {
      if (edit.check === undefined && n === undefined) setVal(edit.date, edit.habit.id, undefined)
      else setVal(edit.date, edit.habit.id, { c: edit.check, n })
    } else {
      setVal(edit.date, edit.habit.id, n)
    }
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
                  const cellCls = 'hg-cell' + (isToday ? ' today' : '')

                  // ①「できた/できない」のみ：タップで巡回
                  if (h.type === 'check' && !h.num) {
                    const c = checkVal(val)
                    return (
                      <td key={dd.d} className={cellCls}>
                        <button
                          className={'hg-check' + (c === true ? ' yes' : c === false ? ' no' : '')}
                          onClick={() => cycleCheck(dd.date, h.id)}
                          aria-label={h.name}
                        >
                          {c === true ? <Check size={15} strokeWidth={3} /> : c === false ? <X size={14} strokeWidth={3} /> : ''}
                        </button>
                      </td>
                    )
                  }

                  // ②「できた/できない＋数値」：数値を表示、色はチェック状態
                  if (h.type === 'check' && h.num) {
                    const c = checkVal(val)
                    const n = numVal(val)
                    const has = c !== undefined || n !== null
                    const cls = !has ? ' empty' : c === true ? ' ok' : c === false ? ' miss' : ''
                    return (
                      <td key={dd.d} className={cellCls}>
                        <button className={'hg-num' + cls} onClick={() => openEdit(dd.date, h)}>
                          {n !== null ? shortNum(h, val) : c === true ? '✓' : c === false ? '✗' : '＋'}
                        </button>
                      </td>
                    )
                  }

                  // ③ 数値 / 記録
                  const n = numVal(val)
                  const isRecord = h.type === 'record'
                  const cls = n === null ? ' empty' : isRecord ? ' rec' : isDone(h, val) ? ' ok' : ' miss'
                  return (
                    <td key={dd.d} className={cellCls}>
                      <button className={'hg-num' + cls} onClick={() => openEdit(dd.date, h)}>
                        {n === null ? '＋' : shortNum(h, val)}
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

            {/* できた/できない（数値つき check のとき） */}
            {combined && (
              <div className="modal-check-row">
                <button
                  className={'modal-check yes' + (edit.check === true ? ' on' : '')}
                  onClick={() => setEdit(x => ({ ...x, check: x.check === true ? undefined : true }))}
                ><Check size={15} strokeWidth={3} /> できた</button>
                <button
                  className={'modal-check no' + (edit.check === false ? ' on' : '')}
                  onClick={() => setEdit(x => ({ ...x, check: x.check === false ? undefined : false }))}
                ><X size={15} strokeWidth={3} /> できなかった</button>
              </div>
            )}

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
              <button className="btn btn-blue" onClick={saveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
