import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { TrendingUp, Heart, BookOpen, CalendarClock } from 'lucide-react'
import { DEADLINES, TARGETS, SMOKING, todayStr } from '../data/initialData.js'
import {
  daysBetween, monthSum, totalSum, monthSub2Sum, monthWorkedDays, monthDoneCount,
  latestVal, numberSeries, yen, habitsForMonth,
} from '../utils/calc.js'

export default function Dashboard({ state }) {
  const days = state.days || {}
  const habits = habitsForMonth(state, todayStr().slice(0, 7))
  const has = (id) => habits.some(h => h.id === id)

  // Uber
  const uberMonthlyTarget = state.targets?.uberMonthlyYen ?? TARGETS.uberMonthlyYen
  const uberHourlyTarget = state.targets?.uberHourlyYen ?? TARGETS.uberHourlyYen
  const uberSales = monthSum(days, 'uber')
  const uberHours = monthSub2Sum(days, 'uber')
  const uberDays = monthWorkedDays(days, 'uber')
  const uberPct = Math.min(100, Math.round((uberSales / uberMonthlyTarget) * 100))
  const avgPerDay = uberDays > 0 ? Math.round(uberSales / uberDays) : 0
  const hourly = uberHours > 0 ? Math.round(uberSales / uberHours) : 0

  // 勉強・健康
  const studyMonth = monthSum(days, 'study')
  const studyTotal = totalSum(days, 'study')
  const weight = latestVal(days, 'weight')
  const weightData = numberSeries(days, 'weight')
  const weightTarget = Number(state.targets?.weightKg) || 0
  // 今月の日数
  const [cy, cmo] = todayStr().slice(0, 7).split('-').map(Number)
  const daysInMonth = new Date(cy, cmo, 0).getDate()
  // 禁煙：今月やめられた日数
  const noSmokeDays = monthDoneCount(days, 'no-smoke')
  const cigsAvoided = noSmokeDays * SMOKING.cigsPerDayBefore
  const smokeSaved = Math.round(cigsAvoided * SMOKING.pricePerPack / SMOKING.cigsPerPack)

  // 筋トレ：チェック型なら✓日数、数字型なら記録した日数＋合計時間
  const workoutHabit = habits.find(h => h.id === 'workout')
  const workoutIsNum = workoutHabit && workoutHabit.type !== 'check'
  const workoutDays = workoutIsNum ? monthWorkedDays(days, 'workout') : monthDoneCount(days, 'workout')
  const workoutTotal = monthSum(days, 'workout')

  // off weed（名前に weed を含むチェック項目）
  const offWeed = habits.find(h => /weed/i.test(h.name || '') && h.type === 'check')

  return (
    <>
      {/* ① 生存資金（Uber） */}
      {has('uber') && (
        <>
          <div className="section-header" style={{ paddingTop: 18 }}>生存資金 — Uber</div>
          <div className="kpi-grid">
            <div className="kpi-card gold-border wide">
              <div className="kpi-label">今月のUber売上 / 目標 {yen(uberMonthlyTarget)}</div>
              <div className="kpi-value gold">{yen(uberSales)}</div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill gold" style={{ width: uberPct + '%' }} />
              </div>
              <div className="kpi-sub">{uberPct}% 達成・{uberDays}日稼働・{uberHours}h</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">1日あたり平均</div>
              <div className="kpi-value gold">{avgPerDay > 0 ? yen(avgPerDay) : '—'}</div>
              <div className="kpi-sub">稼いだ日の平均</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">時給</div>
              <div className={'kpi-value ' + (hourly >= uberHourlyTarget && hourly > 0 ? 'green' : '')}>
                {hourly > 0 ? yen(hourly) : '—'}
              </div>
              <div className="kpi-sub">目標 {yen(uberHourlyTarget)}</div>
            </div>
          </div>
        </>
      )}

      {/* ② 未来への投資（左 宅建・右 FX） */}
      <div className="section-header">未来への投資</div>
      <div className="kpi-grid">
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
        {has('fx') && (
          <div className="kpi-card blue-border">
            <div className="kpi-label"><TrendingUp size={11} style={{ verticalAlign: -1 }} /> FX 本命</div>
            <div className="kpi-value blue">分析のみ</div>
            <div className="kpi-sub">エントリー禁止・技術を磨く</div>
          </div>
        )}
      </div>

      {/* ③ 期限カウントダウン */}
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

      {/* ④ 健康を戻す */}
      <div className="section-header">健康を戻す</div>
      <div className="kpi-grid">
        {has('weight') && (
          <div className="kpi-card green-border">
            <div className="kpi-label"><Heart size={11} style={{ verticalAlign: -1 }} /> 最新体重</div>
            <div className="kpi-value green">{weight !== null ? weight : '—'}<span className="unit">kg</span></div>
            {weightTarget > 0 && <div className="kpi-sub">目標 {weightTarget}kg{weight !== null ? `・あと${Math.max(0, Math.round((weight - weightTarget) * 10) / 10)}kg` : ''}</div>}
          </div>
        )}
        {has('workout') && (
          <div className="kpi-card green-border">
            <div className="kpi-label">今月の筋トレ</div>
            <div className="kpi-value green">{workoutDays}<span className="unit">日</span></div>
            {workoutIsNum && <div className="kpi-sub">計 {workoutTotal}{workoutHabit.unit || 'h'}</div>}
          </div>
        )}
      </div>

      {/* 体重グラフ（最新体重と禁煙の間） */}
      {has('weight') && (
        weightData.length >= 2 ? (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={weightData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#e2e7f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#8a92a6', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d2dae6', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#525a6e' }} formatter={v => v + 'kg'} />
                {weightTarget > 0 && (
                  <ReferenceLine y={weightTarget} stroke="#b8893a" strokeDasharray="4 4"
                    label={{ value: `目標 ${weightTarget}kg`, position: 'insideTopRight', fill: '#9c7320', fontSize: 10 }} />
                )}
                <Line type="monotone" dataKey="value" stroke="#2f9e6f" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty">体重を2日分以上記録するとグラフが出ます</div>
        )
      )}

      {(has('no-smoke') || offWeed) && (
        <div className="kpi-grid">
          {has('no-smoke') && (
            <div className="kpi-card green-border">
              <div className="kpi-label">禁煙（今月）</div>
              <div className="kpi-value green">{noSmokeDays}<span className="unit">/{daysInMonth}日</span></div>
              <div className="kpi-sub">{cigsAvoided}本 / {yen(smokeSaved)} 節約</div>
            </div>
          )}
          {offWeed && (
            <div className="kpi-card green-border">
              <div className="kpi-label">{offWeed.name}（今月）</div>
              <div className="kpi-value green">{monthDoneCount(days, offWeed.id)}<span className="unit">/{daysInMonth}日</span></div>
              <div className="kpi-sub">やめられた日数</div>
            </div>
          )}
        </div>
      )}

      <div style={{ height: 24 }} />
    </>
  )
}
