import React, { useState, useEffect, useRef } from 'react'
import { LayoutGrid, ListChecks, Activity, Settings } from 'lucide-react'
import { buildInitialState, todayStr, DAILY_TEMPLATE } from './data/initialData.js'
import { loadState, saveState, weekdayJP } from './utils/calc.js'
import Dashboard from './components/Dashboard.jsx'
import TodayView from './components/TodayView.jsx'
import LogView from './components/LogView.jsx'
import SettingsView from './components/SettingsView.jsx'

// 古い保存データに tasks が無い場合は補う
function migrate(s) {
  if (!s) return s
  if (!s.tasks) s.tasks = DAILY_TEMPLATE.map(t => ({ ...t }))
  return s
}

export default function App() {
  const [state, setState] = useState(() => migrate(loadState()) || buildInitialState())
  const [tab, setTab] = useState('today')
  const [saving, setSaving] = useState(false)
  const firstRun = useRef(true)

  // 自動保存：stateが変わるたびにlocalStorageへ
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    setSaving(true)
    saveState(state)
    const t = setTimeout(() => setSaving(false), 600)
    return () => clearTimeout(t)
  }, [state])

  const today = todayStr()

  const tabs = [
    { id: 'today', label: '今日', icon: ListChecks },
    { id: 'dash', label: '司令室', icon: LayoutGrid },
    { id: 'log', label: '記録', icon: Activity },
    { id: 'set', label: '設定', icon: Settings },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-text">P26</span>
          </div>
          <div className="header-right">
            <span className={'save-badge' + (saving ? ' saving' : '')}>
              {saving ? '保存中…' : '自動保存'}
            </span>
            <div className="header-date">
              <span className="hd-day">{today.slice(5).replace('-', '/')} ({weekdayJP(today)})</span>
              <span className="hd-label">作戦日</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              className={'tab-btn' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              <Icon />
              <span className="tab-label">{t.label}</span>
            </button>
          )
        })}
      </nav>

      <main className="app-main">
        {tab === 'today' && <TodayView state={state} setState={setState} />}
        {tab === 'dash' && <Dashboard state={state} />}
        {tab === 'log' && <LogView state={state} setState={setState} />}
        {tab === 'set' && <SettingsView state={state} setState={setState} />}
      </main>
    </div>
  )
}
