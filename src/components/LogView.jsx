import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { todayStr } from '../data/initialData.js'
import { series, yen, shiftDay } from '../utils/calc.js'

function getMetric(metrics, date) {
  return metrics.find(m => m.date === date) || { date }
}

export default function LogView({ state, setState }) {
  const today = todayStr()
  const [editDate, setEditDate] = useState(today)

  const existing = getMetric(state.metrics, editDate)
  const [form, setForm] = useState({
    weight: existing.weight ?? '',
    sleep: existing.sleep ?? '',
    uberSales: existing.uberSales ?? '',
    uberHours: existing.uberHours ?? '',
    studyMin: existing.studyMin ?? '',
  })
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    const ex = getMetric(state.metrics, editDate)
    setForm({
      weight: ex.weight ?? '',
      sleep: ex.sleep ?? '',
      uberSales: ex.uberSales ?? '',
      uberHours: ex.uberHours ?? '',
      studyMin: ex.studyMin ?? '',
    })
  }, [editDate])

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function step(k, delta, min = 0) {
    setForm(f => {
      const cur = Number(f[k] || 0)
      const next = Math.max(min, Math.round((cur + delta) * 10) / 10)
      return { ...f, [k]: String(next) }
    })
  }

  function saveLog() {
    setState(prev => {
      const metrics = [...prev.metrics]
      const idx = metrics.findIndex(m => m.date === editDate)
      const entry = {
        date: editDate,
        weight: form.weight === '' ? undefined : Number(form.weight),
        sleep: form.sleep === '' ? undefined : Number(form.sleep),
        uberSales: form.uberSales === '' ? undefined : Number(form.uberSales),
        uberHours: form.uberHours === '' ? undefined : Number(form.uberHours),
        studyMin: form.studyMin === '' ? undefined : Number(form.studyMin),
      }
      if (idx >= 0) metrics[idx] = { ...metrics[idx], ...entry }
      else metrics.push(entry)
      metrics.sort((a, b) => a.date.localeCompare(b.date))
      return { ...prev, metrics }
    })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  const isToday = editDate === today
  const dateLabel = editDate.slice(5).replace('-', '/')

  const weightData = series(state.metrics, 'weight')
  const sleepData = series(state.metrics, 'sleep')
  const uberData = state.metrics
    .filter(m => m.uberSales)
    .map(m => ({ date: m.date.slice(5), uberSales: Number(m.uberSales) }))

  return (
    <>
      {/* 日付ナビ */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{isToday ? '今日の記録' : '記録を修正'} — {dateLabel}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '4px 16px 12px' }}>
        <button className="btn btn-sm btn-ghost" onClick={() => setEditDate(d => shiftDay(d, -1))}>
          <ChevronLeft size={14} /> 前日
        </button>
        <span style={{ color: 'var(--text2)', fontSize: 13, minWidth: 60, textAlign: 'center' }}>
          {isToday ? '今日' : dateLabel}
        </span>
        <button className="btn btn-sm btn-ghost" onClick={() => setEditDate(d => shiftDay(d, 1))} disabled={editDate >= today}>
          翌日 <ChevronRight size={14} />
        </button>
      </div>

      {/* 体重 */}
      <div className="card">
        <div className="card-title green" style={{ marginBottom: 10 }}>体重 (kg)</div>
        <div className="quick-input">
          <input className="input-field big" type="number" inputMode="decimal" step="0.1"
            placeholder="0.0" value={form.weight}
            onChange={e => upd('weight', e.target.value)} />
          <span className="quick-unit">kg</span>
          <button className="chip" onClick={() => step('weight', -0.1)}>−0.1</button>
          <button className="chip" onClick={() => step('weight', 0.1)}>+0.1</button>
        </div>
      </div>

      {/* 睡眠 */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>睡眠 (時間)</div>
        <div className="quick-input">
          <input className="input-field big" type="number" inputMode="decimal" step="0.5"
            placeholder="0" value={form.sleep}
            onChange={e => upd('sleep', e.target.value)} />
          <span className="quick-unit">h</span>
          <button className="chip" onClick={() => step('sleep', -0.5)}>−0.5</button>
          <button className="chip" onClick={() => step('sleep', 0.5)}>+0.5</button>
        </div>
      </div>

      {/* Uber */}
      <div className="card">
        <div className="card-title gold" style={{ marginBottom: 10 }}>Uber 実績</div>
        <div className="input-row">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">売上 (円)</label>
            <input className="input-field" type="number" inputMode="numeric"
              placeholder="0" value={form.uberSales}
              onChange={e => upd('uberSales', e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">稼働 (時間)</label>
            <input className="input-field" type="number" inputMode="decimal"
              placeholder="0" value={form.uberHours}
              onChange={e => upd('uberHours', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 勉強 */}
      <div className="card">
        <div className="card-title accent" style={{ marginBottom: 10, color: 'var(--accent)' }}>宅建 勉強 (分)</div>
        <div className="quick-input">
          <input className="input-field big" type="number" inputMode="numeric" step="30"
            placeholder="0" value={form.studyMin}
            onChange={e => upd('studyMin', e.target.value)} />
          <span className="quick-unit">分</span>
          <button className="chip" onClick={() => step('studyMin', 30)}>+30</button>
          <button className="chip" onClick={() => step('studyMin', 60)}>+60</button>
        </div>
        <div className="quick-hint">よく使う：<button className="chip ghost" onClick={() => upd('studyMin', '120')}>2時間</button><button className="chip ghost" onClick={() => upd('studyMin', '60')}>1時間</button><button className="chip ghost" onClick={() => upd('studyMin', '90')}>1.5時間</button></div>
      </div>

      <div style={{ margin: '14px 16px 0' }}>
        <button className={'btn btn-full ' + (savedFlash ? 'btn-green' : 'btn-blue')} onClick={saveLog}>
          {savedFlash ? <><Check size={15} /> 記録した</> : (isToday ? '今日の記録を保存' : `${dateLabel} の記録を保存`)}
        </button>
      </div>

      {/* 体重グラフ */}
      <div className="section-header">体重の推移</div>
      {weightData.length >= 2 ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#e2e7f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d2dae6', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#525a6e' }} />
              <Line type="monotone" dataKey="weight" stroke="#2f9e6f" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">体重を2日分以上記録するとグラフが出る</div>
      )}

      {/* 睡眠グラフ */}
      <div className="section-header">睡眠時間の推移</div>
      {sleepData.length >= 2 ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={sleepData} margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#e2e7f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 'auto']} tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d2dae6', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#525a6e' }} formatter={v => `${v}h`} />
              <Line type="monotone" dataKey="sleep" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">睡眠を2日分以上記録するとグラフが出る</div>
      )}

      {/* Uber売上グラフ */}
      <div className="section-header">Uber売上の推移</div>
      {uberData.length >= 2 ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={uberData} margin={{ top: 8, right: 20, left: -4, bottom: 0 }}>
              <CartesianGrid stroke="#e2e7f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} width={44}
                tickFormatter={v => (v / 1000) + 'k'} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d2dae6', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#525a6e' }} formatter={v => yen(v)} />
              <Bar dataKey="uberSales" fill="#2f6fed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">Uber売上を2日分以上記録するとグラフが出る</div>
      )}

      <div style={{ height: 24 }} />
    </>
  )
}
