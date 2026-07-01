import React, { useState, useEffect, useRef } from 'react'
import { LayoutGrid, Trophy, Settings } from 'lucide-react'
import { buildInitialState, migrateState, todayStr } from './data/initialData.js'
import { loadState, saveState, weekdayJP } from './utils/calc.js'
import { loadCloud, connectCloud, cloudPull, cloudPush, cloudSubscribe } from './utils/cloud.js'
import GridView from './components/GridView.jsx'
import Dashboard from './components/Dashboard.jsx'
import SettingsView from './components/SettingsView.jsx'

export default function App() {
  const [state, setState] = useState(() => migrateState(loadState()) || buildInitialState())
  const [tab, setTab] = useState('grid')
  const [saving, setSaving] = useState(false)
  const [cloudOn, setCloudOn] = useState(false)
  const firstRun = useRef(true)

  // 常に最新の state を参照できるようにしておく（クラウド初期化の非同期処理用）
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  const cloudCfg = useRef(loadCloud())
  const cloudReady = useRef(false)
  const lastPush = useRef(0)

  // 自動保存：stateが変わるたびにlocalStorage、＋クラウド（有効なら）
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    setSaving(true)
    saveState(state)
    const t = setTimeout(() => setSaving(false), 600)

    let ct
    const c = cloudCfg.current
    if (cloudReady.current && c && c.code) {
      ct = setTimeout(() => {
        cloudPush(c.code, state)
          .then(ts => { lastPush.current = ts })
          .catch(e => console.error('cloud push', e))
      }, 1200)
    }
    return () => { clearTimeout(t); if (ct) clearTimeout(ct) }
  }, [state])

  // クラウド初期化（マウント時に一度だけ）
  useEffect(() => {
    const c = cloudCfg.current
    if (!c || !c.config || !c.code) return
    let cancelled = false
    try { connectCloud(c.config) } catch (e) { console.error('cloud connect', e); return }
    ;(async () => {
      try {
        const remote = await cloudPull(c.code)
        if (cancelled) return
        if (remote && remote.state) {
          setState(migrateState(remote.state) || remote.state)   // クラウドの方を採用
          lastPush.current = remote.updatedAt
        } else {
          const ts = await cloudPush(c.code, stateRef.current)    // 初回はこの端末のデータで種をまく
          lastPush.current = ts
        }
        cloudReady.current = true
        setCloudOn(true)
        cloudSubscribe(c.code, ({ state: rs, updatedAt }) => {
          if (updatedAt > lastPush.current) {                    // 他の端末での更新を受け取る
            lastPush.current = updatedAt
            setState(migrateState(rs) || rs)
          }
        })
      } catch (e) { console.error('cloud init', e) }
    })()
    return () => { cancelled = true }
  }, [])

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
            <span className="logo-text">26</span>
          </div>
          <div className="header-right">
            <span className={'save-badge' + (saving ? ' saving' : '')}>
              {saving ? '保存中…' : cloudOn ? '☁ クラウド' : '自動保存'}
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
        {tab === 'set' && <SettingsView state={state} setState={setState} cloudOn={cloudOn} />}
      </main>
    </div>
  )
}
