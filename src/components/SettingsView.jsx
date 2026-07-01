import React, { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Plus, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Check, Hash } from 'lucide-react'
import { buildInitialState, newHabitId, CATEGORIES, TARGETS, todayStr } from '../data/initialData.js'
import { habitsForMonth } from '../utils/calc.js'
import { loadCloud, saveCloud, clearCloud, parseConfig } from '../utils/cloud.js'

function shiftMonth(m, delta) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function SettingsView({ state, setState, cloudOn }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [editMonth, setEditMonth] = useState(todayStr().slice(0, 7))

  // クラウド設定
  const existingCloud = loadCloud()
  const [cfgText, setCfgText] = useState('')
  const [syncCode, setSyncCode] = useState(existingCloud?.code || '')
  function connectCloudUI() {
    let config
    try { config = parseConfig(cfgText) } catch (e) { alert('Firebaseの設定が読み取れません：' + e.message); return }
    const code = (syncCode || '').trim()
    if (code.length < 4) { alert('同期コードは4文字以上にしてください（自分だけの合言葉）'); return }
    saveCloud({ config, code })
    alert('クラウド保存をオンにしました。読み込み直します。')
    window.location.reload()
  }
  function disconnectCloud() {
    if (!window.confirm('クラウド保存を解除する？\n（この端末のデータは残ります。クラウド上のデータも消えません）')) return
    clearCloud()
    window.location.reload()
  }

  function setTarget(k, v) {
    setState(prev => ({ ...prev, targets: { ...(prev.targets || {}), [k]: v === '' ? 0 : Number(v) } }))
  }

  // ---- 月ごとの項目編集 ----
  const habits = habitsForMonth(state, editMonth)
  const thisMonth = todayStr().slice(0, 7)

  // 編集する月のリストを（無ければ引き継いで）確定させてから書き換える
  function editHabits(fn) {
    setState(prev => {
      const sets = { ...(prev.habitSets || {}) }
      if (!sets[editMonth]) sets[editMonth] = habitsForMonth(prev, editMonth).map(h => ({ ...h }))
      sets[editMonth] = fn(sets[editMonth])
      return { ...prev, habitSets: sets }
    })
  }
  function updHabit(id, key, val) {
    editHabits(arr => arr.map(h => h.id === id ? { ...h, [key]: val } : h))
  }
  function addHabit() {
    editHabits(arr => [...arr, { id: newHabitId(), name: '新しい項目', type: 'check', cat: 'survive' }])
  }
  function removeHabit(id) {
    if (!window.confirm('この項目を今月のリストから外す？\n（過去に記録した数字は消えません。前の月の表にはそのまま残ります）')) return
    editHabits(arr => arr.filter(h => h.id !== id))
  }
  function moveHabit(id, dir) {
    editHabits(arr => {
      const a = [...arr]
      const i = a.findIndex(h => h.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= a.length) return a
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
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

  const [ey, emo] = editMonth.split('-')

  return (
    <>
      <div className="section-header">記録する項目（月ごとに編集）</div>

      {/* 月セレクタ */}
      <div className="week-nav" style={{ marginTop: 6 }}>
        <button className="week-arrow" onClick={() => setEditMonth(m => shiftMonth(m, -1))} aria-label="前の月">
          <ChevronLeft size={20} />
        </button>
        <div className="week-title">
          <span className="week-title-main">{Number(ey)}年 {Number(emo)}月</span>
          <span className="week-title-sub">{editMonth === thisMonth ? '今月' : editMonth > thisMonth ? '未来の月' : '過去の月'}</span>
        </div>
        <button className="week-arrow" onClick={() => setEditMonth(m => shiftMonth(m, 1))} aria-label="次の月">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="alert alert-blue" style={{ marginTop: 8 }}>
        ここで項目を変えても、<b>他の月の項目と過去の記録はそのまま残ります</b>。翌月ぶんを先に用意しておくのもOK。
      </div>

      <div style={{ margin: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
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

            {/* タイプ切り替え（3種類） */}
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
              <button
                className={'cat-pill' + (h.type === 'record' ? ' active' : '')}
                style={h.type === 'record' ? { borderColor: 'var(--text2)', color: 'var(--text2)' } : {}}
                onClick={() => updHabit(h.id, 'type', 'record')}
              ><Hash size={11} style={{ verticalAlign: -1 }} /> 記録だけ</button>
            </div>
            <div className="type-hint">
              {h.type === 'check' && '✓/✗ で達成率に入ります'}
              {h.type === 'number' && '目標以上で達成。達成率に入ります'}
              {h.type === 'record' && '記録するだけ。達成率には入りません（体重など）'}
            </div>

            {/* number：単位＋目標 */}
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

            {/* record：単位のみ */}
            {h.type === 'record' && (
              <div className="input-group" style={{ marginTop: 8, marginBottom: 0 }}>
                <label className="input-label">単位</label>
                <input className="input-field" style={{ fontSize: 13 }}
                  value={h.unit || ''} placeholder="kg / h / 回"
                  onChange={e => updHabit(h.id, 'unit', e.target.value)} />
              </div>
            )}

            {/* check：補足＋「数値も記録」 */}
            {h.type === 'check' && (
              <>
                <input
                  className="input-field"
                  style={{ fontFamily: 'inherit', fontSize: 12, marginTop: 8 }}
                  value={h.hint || ''}
                  onChange={e => updHabit(h.id, 'hint', e.target.value)}
                  placeholder="ひとこと補足（例：エントリーしない。空でもOK）"
                />
                <div className="cat-pills" style={{ marginTop: 8 }}>
                  <button
                    className={'cat-pill' + (h.num ? ' active' : '')}
                    style={h.num ? { borderColor: 'var(--blue)', color: 'var(--blue2)' } : {}}
                    onClick={() => updHabit(h.id, 'num', !h.num)}
                  ><Hash size={11} style={{ verticalAlign: -1 }} /> 数値も記録する{h.num ? '（ON）' : ''}</button>
                </div>
                {h.num && (
                  <div className="input-group" style={{ marginTop: 8, marginBottom: 0 }}>
                    <label className="input-label">記録する数値の単位（達成率には影響しない）</label>
                    <input className="input-field" style={{ fontSize: 13 }}
                      value={h.unit || ''} placeholder="h / 回 / ページ"
                      onChange={e => updHabit(h.id, 'unit', e.target.value)} />
                  </div>
                )}
              </>
            )}

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
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label" style={{ paddingLeft: 4 }}>目標体重（kg）</label>
          <input className="input-field" type="number" inputMode="decimal"
            value={state.targets?.weightKg || ''} placeholder="例 62"
            onChange={e => setTarget('weightKg', e.target.value)} />
        </div>
      </div>

      <div className="section-header">クラウド自動保存（消えない保存）</div>
      {cloudOn || existingCloud ? (
        <>
          <div className="alert alert-blue">
            <b>☁ クラウド保存オン</b>（同期コード：{existingCloud?.code}）<br />
            入力するたびに自動でクラウドに保存されます。別の端末でも同じコードを入れれば同じデータになります。
          </div>
          <div style={{ margin: '12px 16px 0' }}>
            <button className="btn btn-ghost btn-full" onClick={disconnectCloud}>クラウド保存を解除する</button>
          </div>
        </>
      ) : (
        <>
          <div className="alert alert-gold">
            スマホのデータ消去や機種変でも消えないように、無料のFirebaseに自動保存できます。<b>最初の1回だけ設定</b>が必要です（手順は下）。
          </div>
          <div style={{ margin: '10px 16px 0' }}>
            <div className="input-group">
              <label className="input-label">① Firebaseの設定を貼り付け</label>
              <textarea className="memo-area" style={{ minHeight: 90, fontFamily: 'monospace', fontSize: 11 }}
                placeholder={'const firebaseConfig = { apiKey: "...", projectId: "...", ... }\nをまるごと貼り付け'}
                value={cfgText} onChange={e => setCfgText(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">② 同期コード（自分だけの合言葉・4文字以上）</label>
              <input className="input-field" value={syncCode} placeholder="例：stella-1207"
                onChange={e => setSyncCode(e.target.value)} />
            </div>
            <button className="btn btn-blue btn-full" onClick={connectCloudUI}>クラウド保存をオンにする</button>
          </div>
          <div className="alert alert-blue" style={{ marginTop: 12 }}>
            <b>設定のやり方（5分）</b><br />
            1. <b>console.firebase.google.com</b> で無料プロジェクトを作成<br />
            2. 「Firestore Database」を作成（テストモードでOK）<br />
            3. ⚙️プロジェクト設定 → 「マイアプリ」でWebアプリ（&lt;/&gt;）を追加<br />
            4. 出てくる <b>firebaseConfig</b> をコピーして上の①に貼り付け<br />
            分からなければ、この画面のスクショを送ってくれれば一緒に進めます。
          </div>
        </>
      )}

      <div className="section-header">バックアップ・同期（ファイル）</div>
      <div className="alert alert-gold">
        クラウドを使わない場合は、この「書き出し」ファイルを相手側で「読み込む」だけでも移せます。OneDriveに保存しておけば両方から開ける。
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
