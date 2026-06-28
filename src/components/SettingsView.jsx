import React, { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { buildInitialState, newTaskId, CATEGORIES } from '../data/initialData.js'
import { yen } from '../utils/calc.js'

export default function SettingsView({ state, setState }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  function setMission(v) { setState(prev => ({ ...prev, mission: v })) }
  function setMoney(k, v) {
    setState(prev => ({ ...prev, money: { ...prev.money, [k]: v === '' ? 0 : Number(v) } }))
  }

  // ---- タスク編集 ----
  const tasks = state.tasks || []
  function updTask(id, key, val) {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, [key]: val } : t),
    }))
  }
  function addTask() {
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: newTaskId(), name: '新しいタスク', meta: '', cat: 'survive' }],
    }))
  }
  function removeTask(id) {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }))
  }
  function moveTask(id, dir) {
    setState(prev => {
      const arr = [...prev.tasks]
      const i = arr.findIndex(t => t.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return prev
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...prev, tasks: arr }
    })
  }

  // バックアップ：JSONをダウンロード
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `stella-command-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('バックアップを書き出した')
    setTimeout(() => setMsg(''), 2500)
  }

  // 復元：JSONを読み込む
  function importData(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.version) throw new Error('形式が違う')
        setState(data)
        setMsg('復元した')
      } catch (err) {
        setMsg('読み込み失敗：ファイルを確認して')
      }
      setTimeout(() => setMsg(''), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function resetAll() {
    if (!window.confirm('全データを消して初期状態に戻す？\n（先にバックアップ推奨）')) return
    setState(buildInitialState())
    setMsg('初期化した')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <>
      <div className="section-header">今日の最優先ミッション</div>
      <div style={{ margin: '6px 16px 0' }}>
        <textarea
          className="memo-area"
          style={{ minHeight: 60 }}
          value={state.mission}
          onChange={e => setMission(e.target.value)}
          placeholder="今日これだけは、という一手"
        />
      </div>

      <div className="section-header">今日やること（編集）</div>
      <div style={{ margin: '6px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t, i) => (
          <div key={t.id} className="edit-task">
            <div className="edit-task-top">
              <span className={'task-cat-bar cat-' + t.cat} style={{ height: 18, width: 3, borderRadius: 3 }} />
              <input
                className="input-field"
                style={{ flex: 1, fontFamily: 'inherit', fontSize: 13 }}
                value={t.name}
                onChange={e => updTask(t.id, 'name', e.target.value)}
                placeholder="タスク名"
              />
              <button className="icon-btn" onClick={() => moveTask(t.id, -1)} disabled={i === 0} aria-label="上へ">
                <ChevronUp size={16} />
              </button>
              <button className="icon-btn" onClick={() => moveTask(t.id, 1)} disabled={i === tasks.length - 1} aria-label="下へ">
                <ChevronDown size={16} />
              </button>
              <button className="icon-btn danger" onClick={() => removeTask(t.id)} aria-label="削除">
                <Trash2 size={15} />
              </button>
            </div>
            <input
              className="input-field"
              style={{ fontFamily: 'inherit', fontSize: 12, marginTop: 6 }}
              value={t.meta}
              onChange={e => updTask(t.id, 'meta', e.target.value)}
              placeholder="サブ文（目標・メモなど。空でもOK）"
            />
            <div className="cat-pills">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={'cat-pill' + (t.cat === c.id ? ' active' : '')}
                  style={t.cat === c.id ? { borderColor: c.color, color: c.color } : {}}
                  onClick={() => updTask(t.id, 'cat', c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn btn-ghost btn-full" onClick={addTask}>
          <Plus size={15} /> タスクを追加
        </button>
      </div>

      <div className="section-header">お金（手入力）</div>
      <div className="kpi-grid">
        <div className="input-group" style={{ margin: '0 0 0 0' }}>
          <label className="input-label" style={{ paddingLeft: 4 }}>固定費 / 月</label>
          <input className="input-field" type="number" inputMode="numeric"
            value={state.money.fixedCost || ''} placeholder="0"
            onChange={e => setMoney('fixedCost', e.target.value)} />
        </div>
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label" style={{ paddingLeft: 4 }}>今月の支出</label>
          <input className="input-field" type="number" inputMode="numeric"
            value={state.money.monthSpend || ''} placeholder="0"
            onChange={e => setMoney('monthSpend', e.target.value)} />
        </div>
      </div>
      <div className="alert alert-blue">
        借金やFXの細かい管理は <b>STELLA FINANCE</b> 側に任せる設計。ここは「今を生きるお金」だけ淡々と。
      </div>

      <div className="section-header">バックアップ・同期</div>
      <div className="alert alert-gold">
        スマホ↔PCの同期や機種変の復元は、この「書き出し」ファイルを相手側で「読み込む」だけ。OneDriveに保存しておけば両方から開ける。
      </div>
      <div style={{ margin: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-blue btn-full" onClick={exportData}>
          <Download size={15} /> バックアップを書き出す
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> バックアップから復元する
        </button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importData} />
        <button className="btn btn-red btn-full" onClick={resetAll}>
          <RotateCcw size={15} /> 全データを初期化
        </button>
        {msg && <div className="alert alert-blue center" style={{ margin: '4px 0 0' }}>{msg}</div>}
      </div>

      <div className="alert alert-blue" style={{ marginTop: 16 }}>
        データはこの端末のブラウザに自動保存される。タスク内容や目標を変えたい時は、コードの <b>initialData.js</b> を書き換えればOK。
      </div>

      <div style={{ height: 24 }} />
    </>
  )
}
