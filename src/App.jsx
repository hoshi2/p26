import React, { useState, useEffect, useRef } from 'react'
import { LayoutGrid, Trophy, Settings } from 'lucide-react'
import { buildInitialState, migrateState, todayStr } from './data/initialData.js'
import { loadState, saveState, weekdayJP } from './utils/calc.js'
import GridView from './components/GridView.jsx'
import Dashboard from './components/Dashboard.jsx'
import SettingsView from './components/SettingsView.jsx'

export default function App() {
  const [state, setState] = useState(() => migrateState(loadState()) || buildInitialState())
  const [tab, setTab] = useState('grid')
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
    { id: 'grid', label: '習慣', icon: LayoutGrid },
    { id: 'dash', label: '成果', icon: Trophy },
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
        {tab === 'grid' && <GridView state={state} setState={setState} />}
        {tab === 'dash' && <Dashboard state={state} />}
        {tab === 'set' && <SettingsView state={state} setState={setState} />}
      </main>
    </div>
  )
}
