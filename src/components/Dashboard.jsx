import React from 'react'
import { TrendingUp, Heart, BookOpen, CalendarClock } from 'lucide-react'
import { DEADLINES, TARGETS, todayStr } from '../data/initialData.js'
import {
  calcStreak, weekRate, monthRate, daysBetween,
  monthSum, totalSum, monthDoneCount, latestVal,
  smokingStats, yen, habitsForMonth,
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
  const days = state.days || {}
  const habits = habitsForMonth(state, todayStr().slice(0, 7))
  const has = (id) => habits.some(h => h.id === id)

  const streak = calcStreak(days, habits)
  const wRate = weekRate(days, habits)
  const mRate = monthRate(days, habits)

  const uberMonthlyTarget = state.targets?.uberMonthlyYen ?? TARGETS.uberMonthlyYen
  const uberSales = monthSum(days, 'uber')
  const uberPct = Math.min(100, Math.round((uberSales / uberMonthlyTarget) * 100))

  const studyMonth = monthSum(days, 'study')
  const studyTotal = totalSum(days, 'study')
  const weight = latestVal(days, 'weight')
  const smoke = smokingStats(days, 'no-smoke')
  const workoutDays = monthDoneCount(days, 'workout')

  return (
    <>
      {/* 達成率リング */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <span className="card-title blue">達成率</span>
        </div>
        <div className="ring-wrap">
          <Ring pct={wRate} color="var(--blue)" sub="週間" />
          <Ring pct={mRate} color="var(--accent)" sub="月間" />
        </div>
      </div>

      {/* 生存資金（Uber） */}
      {has('uber') && (
        <>
          <div className="section-header">生存資金 — Uber</div>
          <div className="kpi-grid">
            <div className="kpi-card gold-border wide">
              <div className="kpi-label">今月のUber売上 / 目標 {yen(uberMonthlyTarget)}</div>
              <div className="kpi-value gold">{yen(uberSales)}</div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill gold" style={{ width: uberPct + '%' }} />
              </div>
              <div className="kpi-sub">{uberPct}% 達成</div>
            </div>
          </div>
        </>
      )}

      {/* 未来 / 勉強 */}
      <div className="section-header">未来への投資</div>
      <div className="kpi-grid">
        {has('fx') && (
          <div className="kpi-card blue-border">
            <div className="kpi-label"><TrendingUp size={11} style={{ verticalAlign: -1 }} /> FX 本命</div>
            <div className="kpi-value blue">分析のみ</div>
            <div className="kpi-sub">エントリー禁止・技術を磨く</div>
          </div>
        )}
        {has('study') && (
          <div className="kpi-card">
            <div className="kpi-label"><BookOpen size={11} style={{ verticalAlign: -1 }} /> 宅建 累計</div>
            <div className="kpi-value accent">{studyTotal}<span className="unit">/{TARGETS.studyTotalTarget}h</span></div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill accent" style={{ width: Math.min(100, Math.round((studyTotal / TARGETS.studyTotalTarget) * 100)) + '%' }} />
            </div>
            <div className="kpi-sub">今月 {studyMonth}h・合格目安300h</div>
          </div>
        )}
      </div>

      {/* 健康 */}
      <div className="section-header">健康を戻す</div>
      <div className="kpi-grid">
        {has('weight') && (
          <div className="kpi-card green-border">
            <div className="kpi-label"><Heart size={11} style={{ verticalAlign: -1 }} /> 最新体重</div>
            <div className="kpi-value green">{weight !== null ? weight : '—'}<span className="unit">kg</span></div>
          </div>
        )}
        {has('workout') && (
          <div className="kpi-card green-border">
            <div className="kpi-label">今月の筋トレ</div>
            <div className="kpi-value green">{workoutDays}<span className="unit">日</span></div>
          </div>
        )}
        {has('no-smoke') && (
          <div className="kpi-card green-border wide">
            <div className="kpi-label">禁煙 継続</div>
            <div className="kpi-value green">{smoke.days}<span className="unit">日</span></div>
            <div className="kpi-sub">{smoke.cigsAvoided}本 我慢 / {yen(smoke.saved)} 節約</div>
          </div>
        )}
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

      {/* 連続達成（控えめに一番下） */}
      <div style={{ margin: '22px 16px 0', color: 'var(--text3)', fontSize: 12, textAlign: 'center' }}>
        全部達成できた日の連続：<b style={{ color: 'var(--text2)' }}>{streak}</b> 日
      </div>

      <div style={{ height: 24 }} />
    </>
  )
}
