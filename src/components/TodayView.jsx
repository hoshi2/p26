import React from 'react'
import { Check, ShieldX } from 'lucide-react'
import { AVOID_TEMPLATE, todayStr } from '../data/initialData.js'
import { avoidStreak, dayRate, shiftDay } from '../utils/calc.js'

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

  // やらないこと：「崩した」を記録 / 「リセット（また続ける）」
  function breakAvoid(id) {
    setState(prev => ({
      ...prev,
      avoid: { ...prev.avoid, [id]: { ...prev.avoid[id], brokeOn: today } },
    }))
  }
  function resumeAvoid(id) {
    setState(prev => ({
      ...prev,
      avoid: { ...prev.avoid, [id]: { brokeOn: today, since: today } },
    }))
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
      <div className="section-header">やらないこと（守りの管理）</div>
      <div className="avoid-list">
        {AVOID_TEMPLATE.map(a => {
          const entry = state.avoid[a.id]
          const streak = avoidStreak(entry)
          const brokeToday = entry?.brokeOn === today
          return (
            <div key={a.id} className={'avoid-item' + (brokeToday ? ' broke' : ' held')}>
              <ShieldX size={16} color={brokeToday ? 'var(--red)' : 'var(--green)'} />
              <span className="avoid-item-name">{a.name}</span>
              {brokeToday ? (
                <button className="btn btn-sm btn-green" onClick={() => resumeAvoid(a.id)}>
                  仕切り直す
                </button>
              ) : (
                <>
                  <span className="avoid-streak">{streak}{a.unit}連続</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => breakAvoid(a.id)}>
                    崩した
                  </button>
                </>
              )}
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
