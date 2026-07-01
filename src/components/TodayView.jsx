import React from 'react'
import { Check, ShieldCheck, ShieldX } from 'lucide-react'
import { AVOID_TEMPLATE, todayStr } from '../data/initialData.js'
import { avoidStreak, dayRate } from '../utils/calc.js'

export default function TodayView({ state, setState }) {
  const today = todayStr()
  const dayLog = state.days[today] || { tasks: {} }
  const tasks = state.tasks || []
  const rate = dayRate(dayLog, tasks)

  function toggleTask(id) {
    setState(prev => {
      const days = { ...prev.days }
      const log = { ...(days[today] || { tasks: {} }) }
      log.tasks = { ...log.tasks, [id]: !log.tasks?.[id] }
      days[today] = log
      return { ...prev, days }
    })
  }

  function setAvoid(id, val) {
    setState(prev => {
      const days = { ...prev.days }
      const log = { ...(days[today] || { tasks: {} }) }
      log.avoid = { ...(log.avoid || {}), [id]: val }
      days[today] = log
      return { ...prev, days }
    })
  }

  function setMemo(v) {
    setState(prev => ({ ...prev, memo: v }))
  }

  const doneCount = tasks.filter(t => dayLog.tasks?.[t.id]).length

  return (
    <>
      {/* 今日やること */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 18 }}>
        <span>今日やること</span>
        <span style={{ color: 'var(--blue2)' }}>{doneCount}/{tasks.length}・{rate}%</span>
      </div>
      <div className="task-list">
        {tasks.map(t => {
          const done = !!dayLog.tasks?.[t.id]
          return (
            <div key={t.id} className={'task-item' + (done ? ' done' : '')}>
              <div className={'task-cat-bar cat-' + t.cat} />
              <div className="task-main">
                <div className="task-name">{t.name}</div>
                {t.meta && <div className="task-meta">{t.meta}</div>}
              </div>
              <button
                className={'check-toggle blue' + (done ? ' checked' : '')}
                onClick={() => toggleTask(t.id)}
                aria-label={done ? '未完了に戻す' : '完了にする'}
              >
                {done && <Check size={13} strokeWidth={3} />}
              </button>
            </div>
          )
        })}
      </div>

      {/* やらないこと */}
      <div className="section-header">やらないこと（今日の記録）</div>
      <div className="avoid-list">
        {AVOID_TEMPLATE.map(a => {
          const streak = avoidStreak(state.days, a.id)
          const todayVal = state.days[today]?.avoid?.[a.id]
          return (
            <div key={a.id} className={'avoid-item' + (todayVal === false ? ' broke' : todayVal === true ? ' held' : '')}>
              {todayVal === false
                ? <ShieldX size={16} color="var(--red)" />
                : <ShieldCheck size={16} color={todayVal === true ? 'var(--green)' : 'var(--text3)'} />
              }
              <span className="avoid-item-name">{a.name}</span>
              <span className="avoid-streak">{streak}{a.unit}連続</span>
              <button
                className={'btn btn-sm ' + (todayVal === true ? 'btn-green' : 'btn-ghost')}
                onClick={() => setAvoid(a.id, true)}
              >守った</button>
              <button
                className={'btn btn-sm ' + (todayVal === false ? 'btn-red' : 'btn-ghost')}
                onClick={() => setAvoid(a.id, false)}
              >崩した</button>
            </div>
          )
        })}
      </div>

      {/* メモ */}
      <div className="section-header">頭の中を出す（メモ）</div>
      <div style={{ margin: '6px 16px 0' }}>
        <textarea
          className="memo-area"
          placeholder="気になること、忘れたくないこと、ここに全部出す"
          value={state.memo}
          onChange={e => setMemo(e.target.value)}
        />
      </div>
    </>
  )
}
