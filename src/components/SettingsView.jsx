import React, { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Plus, Trash2, ChevronUp, ChevronDown, Check, Hash } from 'lucide-react'
import { buildInitialState, newHabitId, CATEGORIES, TARGETS } from '../data/initialData.js'

export default function SettingsView({ state, setState }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  function setMission(v) { setState(prev => ({ ...prev, mission: v })) }
  function setMoney(k, v) {
    setState(prev => ({ ...prev, money: { ...prev.money, [k]: v === '' ? 0 : Number(v) } }))
  }
  function setTarget(k, v) {
    setState(prev => ({ ...prev, targets: { ...(prev.targets || {}), [k]: v === '' ? 0 : Number(v) } }))
  }

  // ---- 習慣（項目）編集 ----
  const habits = state.habits || []
  function updHabit(id, key, val) {
    setState(prev => ({ ...prev, habits: prev.habits.map(h => h.id === id ? { ...h, [key]: val } : h) }))
  }
  function addHabit() {
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { id: newHabitId(), name: '新しい項目', type: 'check', cat: 'survive' }],
    }))
  }
  function removeHabit(id) {
    if (!window.confirm('この項目を削除する？（過去の記録も表示されなくなります）')) return
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }))
  }
  function moveHabit(id, dir) {
    setState(prev => {
      const arr = [...prev.habits]
      const i = arr.findIndex(h => h.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return prev
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...prev, habits: arr }
    })
  }

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

      <div className="section-header">記録する項目（自由に編集）</div>
      <div style={{ margin: '6px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {habits.map((h, i) => (
          <div key={h.id} className="edit-task">
            <div className="edit-task-top">
              <span className={'task-cat-bar cat-' + h.cat} style={{ height: 18, width: 3, borderRadius: 3 }} />
              <input
                className="input-field"
                style={{ flex: 1, fontFamily: 'inherit', fontSize: 13 }}
                value={h.name}
                onChange={e => updHabit(h.id, 'name', e.target.value)}
                placeholder="項目名"
              />
              <button className="icon-btn" onClick={() => moveHabit(h.id, -1)} disabled={i === 0} aria-label="上へ">
                <ChevronUp size={16} />
              </button>
              <button className="icon-btn" onClick={() => moveHabit(h.id, 1)} disabled={i === habits.length - 1} aria-label="下へ">
                <ChevronDown size={16} />
              </button>
              <button className="icon-btn danger" onClick={() => removeHabit(h.id)} aria-label="削除">
                <Trash2 size={15} />
              </button>
            </div>

            {/* タイプ切り替え */}
            <div className="cat-pills" style={{ marginTop: 8 }}>
              <button
                className={'cat-pill' + (h.type === 'check' ? ' active' : '')}
                style={h.type === 'check' ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
                onClick={() => updHabit(h.id, 'type', 'check')}
              ><Check size={11} style={{ verticalAlign: -1 }} /> できた/できない</button>
              <button
                className={'cat-pill' + (h.type === 'number' ? ' active' : '')}
                style={h.type === 'number' ? { borderColor: 'var(--blue)', color: 'var(--blue2)' } : {}}
                onClick={() => updHabit(h.id, 'type', 'number')}
              ><Hash size={11} style={{ verticalAlign: -1 }} /> 数字で記録</button>
            </div>

            {/* number のときだけ 単位・目標 */}
            {h.type === 'number' && (
              <div className="input-row" style={{ marginTop: 8 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">単位</label>
                  <input className="input-field" style={{ fontSize: 13 }}
                    value={h.unit || ''} placeholder="円 / h / kg"
                    onChange={e => updHabit(h.id, 'unit', e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">1日の目標（空=なし）</label>
                  <input className="input-field" type="number" inputMode="decimal" style={{ fontSize: 13 }}
                    value={h.target ?? ''} placeholder="例 15000"
                    onChange={e => updHabit(h.id, 'target', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
              </div>
            )}
            {h.type === 'check' && (
              <input
                className="input-field"
                style={{ fontFamily: 'inherit', fontSize: 12, marginTop: 8 }}
                value={h.hint || ''}
                onChange={e => updHabit(h.id, 'hint', e.target.value)}
                placeholder="ひとこと補足（例：エントリーしない。空でもOK）"
              />
            )}

            {/* カテゴリ（色） */}
            <div className="cat-pills">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={'cat-pill' + (h.cat === c.id ? ' active' : '')}
                  style={h.cat === c.id ? { borderColor: c.color, color: c.color } : {}}
                  onClick={() => updHabit(h.id, 'cat', c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn btn-ghost btn-full" onClick={addHabit}>
          <Plus size={15} /> 項目を追加
        </button>
      </div>

      <div className="section-header">Uber 月間目標</div>
      <div className="kpi-grid">
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label" style={{ paddingLeft: 4 }}>月間売上目標（円）</label>
          <input className="input-field" type="number" inputMode="numeric"
            value={state.targets?.uberMonthlyYen ?? TARGETS.uberMonthlyYen} placeholder="300000"
            onChange={e => setTarget('uberMonthlyYen', e.target.value)} />
        </div>
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label" style={{ paddingLeft: 4 }}>時給目標（円）</label>
          <input className="input-field" type="number" inputMode="numeric"
            value={state.targets?.uberHourlyYen ?? TARGETS.uberHourlyYen} placeholder="2500"
            onChange={e => setTarget('uberHourlyYen', e.target.value)} />
        </div>
      </div>

      <div className="section-header">お金（手入力）</div>
      <div className="kpi-grid">
        <div className="input-group" style={{ margin: 0 }}>
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

      <div style={{ height: 24 }} />
    </>
  )
}
