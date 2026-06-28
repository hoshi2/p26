import React from 'react'
import { Banknote, TrendingUp, Heart, BookOpen, Flame, CalendarClock } from 'lucide-react'
import { DEADLINES, TARGETS, todayStr } from '../data/initialData.js'
import {
  calcStreak, weekRate, monthRate, daysBetween,
  monthUberSales, monthUberHours, monthStudyHours, totalStudyHours,
  latestWeight, smokingStats, yen,
} from '../utils/calc.js'

function Ring({ pct, color, sub }) {
  const r = 32, c = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <div className="ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--bg4)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="ring-label">
        <span className="ring-pct">{pct}%</span>
        <span className="ring-sub">{sub}</span>
      </div>
    </div>
  )
}

export default function Dashboard({ state }) {
  const tasks = state.tasks || []
  const streak = calcStreak(state.days, tasks)
  const wRate = weekRate(state.days, tasks)
  const mRate = monthRate(state.days, tasks)

  const uberSales = monthUberSales(state.metrics)
  const uberHours = monthUberHours(state.metrics)
  const uberPct = Math.min(100, Math.round((uberSales / TARGETS.uberMonthlyYen) * 100))
  const realHourly = uberHours > 0 ? Math.round(uberSales / uberHours) : 0

  const studyMonth = monthStudyHours(state.metrics)
  const studyTotal = totalStudyHours(state.metrics)
  const weight = latestWeight(state.metrics)
  const smoke = smokingStats(state.avoid['no-smoke'])

  return (
    <>
      {/* ストリーク */}
      <div className="streak-row">
        <Flame size={30} color="var(--gold2)" />
        <span className="streak-num">{streak}</span>
        <div className="streak-info">
          <div className="streak-title">連続達成日数</div>
          <div className="streak-sub">全タスクを完了した日が続いている数</div>
        </div>
      </div>

      {/* 達成率リング */}
      <div className="card">
        <div className="card-head">
          <span className="card-title blue">達成率</span>
        </div>
        <div className="ring-wrap">
          <Ring pct={wRate} color="var(--blue)" sub="WEEK" />
          <Ring pct={mRate} color="var(--accent)" sub="MONTH" />
        </div>
      </div>

      {/* 生存資金（Uber） */}
      <div className="section-header">生存資金 — Uber</div>
      <div className="kpi-grid">
        <div className="kpi-card gold-border wide">
          <div className="kpi-label">今月のUber売上 / 目標 {yen(TARGETS.uberMonthlyYen)}</div>
          <div className="kpi-value gold">{yen(uberSales)}</div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill gold" style={{ width: uberPct + '%' }} />
          </div>
          <div className="kpi-sub">{uberPct}% 達成</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">今月の稼働</div>
          <div className="kpi-value">{uberHours}<span className="unit">h</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">実時給</div>
          <div className={'kpi-value ' + (realHourly >= TARGETS.uberHourlyYen ? 'green' : '')}>
            {realHourly > 0 ? yen(realHourly) : '—'}
          </div>
          <div className="kpi-sub">目標 {yen(TARGETS.uberHourlyYen)}</div>
        </div>
      </div>

      {/* 未来（FX / 勉強） */}
      <div className="section-header">未来への投資</div>
      <div className="kpi-grid">
        <div className="kpi-card blue-border">
          <div className="kpi-label"><TrendingUp size={11} style={{ verticalAlign: -1 }} /> FX 本命</div>
          <div className="kpi-value blue">分析のみ</div>
          <div className="kpi-sub">エントリー禁止・技術を磨く</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><BookOpen size={11} style={{ verticalAlign: -1 }} /> 宅建 累計</div>
          <div className="kpi-value accent">{studyTotal}<span className="unit">/{TARGETS.studyTotalTarget}h</span></div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill accent" style={{ width: Math.min(100, Math.round((studyTotal / TARGETS.studyTotalTarget) * 100)) + '%' }} />
          </div>
          <div className="kpi-sub">今月 {studyMonth}h・合格目安300h</div>
        </div>
      </div>

      {/* 健康 */}
      <div className="section-header">健康を戻す</div>
      <div className="kpi-grid">
        <div className="kpi-card green-border">
          <div className="kpi-label"><Heart size={11} style={{ verticalAlign: -1 }} /> 最新体重</div>
          <div className="kpi-value green">{weight !== null ? weight : '—'}<span className="unit">kg</span></div>
        </div>
        <div className="kpi-card green-border">
          <div className="kpi-label">禁煙 継続</div>
          <div className="kpi-value green">{smoke.days}<span className="unit">日</span></div>
          <div className="kpi-sub">{smoke.cigsAvoided}本 我慢 / {yen(smoke.saved)} 節約</div>
        </div>
      </div>

      {/* カウントダウン */}
      {DEADLINES.length > 0 && (
        <>
          <div className="section-header">期限カウントダウン</div>
          <div className="countdown-list">
            {DEADLINES.map(d => {
              const left = daysBetween(todayStr(), d.date)
              const cls = left <= 14 ? 'urgent' : left <= 45 ? 'soon' : 'far'
              return (
                <div key={d.id} className="countdown-item">
                  <CalendarClock size={15} color="var(--text3)" />
                  <span className="countdown-name">{d.name}（{d.date}）</span>
                  <span className={'countdown-days ' + cls}>
                    {left >= 0 ? left : '過'}<span className="unit">{left >= 0 ? '日' : ''}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ height: 24 }} />
    </>
  )
}
