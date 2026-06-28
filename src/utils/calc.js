import { todayStr, SMOKING, DAILY_TEMPLATE } from '../data/initialData.js'

const KEY = 'stella-command-v1'

// ---- localStorage 保存・読み込み（自動保存の心臓部）----
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('読み込み失敗', e)
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch (e) {
    console.error('保存失敗', e)
    return false
  }
}

// ---- 日付ユーティリティ ----
export function daysBetween(fromStr, toStr) {
  const a = new Date(fromStr + 'T00:00:00')
  const b = new Date(toStr + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

export function shiftDay(str, delta) {
  const d = new Date(str + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return todayStr(d)
}

export function weekdayJP(str) {
  const d = new Date(str + 'T00:00:00')
  return ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
}

// ---- その日のタスク達成率 ----
export function dayRate(dayLog, tasks = DAILY_TEMPLATE) {
  if (!dayLog || !dayLog.tasks) return 0
  const total = tasks.length
  const done = tasks.filter(t => dayLog.tasks[t.id]).length
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

// ---- ストリーク（連続で「全部やった日」が続いた数）----
// 全タスク完了した日を1としてカウント。今日から遡る。
export function calcStreak(days, tasks = DAILY_TEMPLATE) {
  let streak = 0
  let cursor = todayStr()
  // 今日がまだ未完了でも、昨日までで連続が続いていればそれを数える
  for (let i = 0; i < 400; i++) {
    const log = days[cursor]
    const rate = dayRate(log, tasks)
    if (rate === 100) {
      streak++
      cursor = shiftDay(cursor, -1)
    } else {
      // 今日(i===0)がまだ未完なら飛ばして昨日から数え始める
      if (i === 0) { cursor = shiftDay(cursor, -1); continue }
      break
    }
  }
  return streak
}

// ---- 週間達成率（過去7日平均）----
export function weekRate(days, tasks = DAILY_TEMPLATE) {
  let sum = 0
  for (let i = 0; i < 7; i++) {
    const d = shiftDay(todayStr(), -i)
    sum += dayRate(days[d], tasks)
  }
  return Math.round(sum / 7)
}

// ---- 月間達成率（過去30日平均）----
export function monthRate(days, tasks = DAILY_TEMPLATE) {
  let sum = 0
  for (let i = 0; i < 30; i++) {
    const d = shiftDay(todayStr(), -i)
    sum += dayRate(days[d], tasks)
  }
  return Math.round(sum / 30)
}

// ---- やらないこと：継続日数 ----
export function avoidStreak(avoidEntry) {
  if (!avoidEntry) return 0
  const start = avoidEntry.brokeOn || avoidEntry.since
  if (!start) return 0
  return Math.max(0, daysBetween(start, todayStr()))
}

// ---- 禁煙：節約額・本数 ----
export function smokingStats(avoidEntry) {
  const days = avoidStreak(avoidEntry)
  const cigsAvoided = days * SMOKING.cigsPerDayBefore
  const yenPerCig = SMOKING.pricePerPack / SMOKING.cigsPerPack
  const saved = Math.round(cigsAvoided * yenPerCig)
  return { days, cigsAvoided, saved }
}

// ---- メトリクスから特定キーの時系列を取り出す（グラフ用）----
export function series(metrics, key) {
  return metrics
    .filter(m => m[key] !== undefined && m[key] !== null && m[key] !== '')
    .map(m => ({ date: m.date.slice(5), [key]: Number(m[key]) }))
}

// ---- 今月のUber売上合計 ----
export function monthUberSales(metrics) {
  const ym = todayStr().slice(0, 7)
  return metrics
    .filter(m => m.date.startsWith(ym) && m.uberSales)
    .reduce((s, m) => s + Number(m.uberSales), 0)
}

export function monthUberHours(metrics) {
  const ym = todayStr().slice(0, 7)
  return metrics
    .filter(m => m.date.startsWith(ym) && m.uberHours)
    .reduce((s, m) => s + Number(m.uberHours), 0)
}

// ---- 今月の累計勉強時間（分→時間）----
export function monthStudyHours(metrics) {
  const ym = todayStr().slice(0, 7)
  const min = metrics
    .filter(m => m.date.startsWith(ym) && m.studyMin)
    .reduce((s, m) => s + Number(m.studyMin), 0)
  return Math.round(min / 6) / 10 // 0.1h単位
}

export function totalStudyHours(metrics) {
  const min = metrics
    .filter(m => m.studyMin)
    .reduce((s, m) => s + Number(m.studyMin), 0)
  return Math.round(min / 6) / 10
}

// ---- 最新の体重 ----
export function latestWeight(metrics) {
  const w = metrics.filter(m => m.weight).slice(-1)[0]
  return w ? Number(w.weight) : null
}

export function yen(n) {
  return '¥' + Math.round(n).toLocaleString('ja-JP')
}
