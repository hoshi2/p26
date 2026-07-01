import { todayStr, SMOKING, HABIT_TEMPLATE } from '../data/initialData.js'

// その月の項目リストを返す。無ければ直前の月から引き継ぎ、無ければテンプレ。
export function habitsForMonth(state, month) {
  const sets = state.habitSets || {}
  if (sets[month]) return sets[month]
  const earlier = Object.keys(sets).filter(k => k < month).sort()
  if (earlier.length) return sets[earlier[earlier.length - 1]]
  const all = Object.keys(sets).sort()
  if (all.length) return sets[all[0]]
  return HABIT_TEMPLATE
}

const KEY = 'stella-command-v1'

// ---- localStorage 保存・読み込み ----
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

export function weekdayIdx(str) {
  return new Date(str + 'T00:00:00').getDay()
}

// ---- 習慣まわり ----
// その日の値を取り出す
export function dayVal(days, date, id) {
  return days?.[date]?.v?.[id]
}

// 達成率の分母に数えるか（check、または目標つきnumber）
export function countsForRate(habit) {
  return habit.type === 'check' || (habit.type === 'number' && habit.target != null && habit.target !== '')
}

// その習慣がその日に「達成」したか
export function isDone(habit, val) {
  if (val === undefined || val === null || val === '') return false
  if (habit.type === 'check') return val === true
  // number
  if (habit.target != null && habit.target !== '') return Number(val) >= Number(habit.target)
  return true // 目標なしの数値は「入力があれば達成扱い」
}

// その日のタスク達成率（%）
export function dayRate(days, date, habits) {
  const core = habits.filter(countsForRate)
  if (core.length === 0) return 0
  const done = core.filter(h => isDone(h, dayVal(days, date, h.id))).length
  return Math.round((done / core.length) * 100)
}

// ストリーク（連続で「全部達成した日」が続いた数）
export function calcStreak(days, habits) {
  let streak = 0
  let cursor = todayStr()
  for (let i = 0; i < 400; i++) {
    const rate = dayRate(days, cursor, habits)
    if (rate === 100) {
      streak++
      cursor = shiftDay(cursor, -1)
    } else {
      if (i === 0) { cursor = shiftDay(cursor, -1); continue }
      break
    }
  }
  return streak
}

export function weekRate(days, habits) {
  let sum = 0
  for (let i = 0; i < 7; i++) sum += dayRate(days, shiftDay(todayStr(), -i), habits)
  return Math.round(sum / 7)
}

export function monthRate(days, habits) {
  let sum = 0
  for (let i = 0; i < 30; i++) sum += dayRate(days, shiftDay(todayStr(), -i), habits)
  return Math.round(sum / 30)
}

// check習慣：今日（未入力なら昨日）から遡って ✓ が続く数
export function checkStreak(days, id) {
  let streak = 0
  let cursor = todayStr()
  for (let i = 0; i < 400; i++) {
    const val = dayVal(days, cursor, id)
    if (val === true) {
      streak++
      cursor = shiftDay(cursor, -1)
    } else if (val === false) {
      break
    } else {
      if (i === 0) { cursor = shiftDay(cursor, -1); continue }
      break
    }
  }
  return streak
}

// ---- 集計（指定 年月 "YYYY-MM"、省略で今月）----
function ym(month) { return month || todayStr().slice(0, 7) }

// number習慣の合計
export function monthSum(days, id, month) {
  const m = ym(month)
  let sum = 0
  for (const [date, log] of Object.entries(days || {})) {
    if (!date.startsWith(m)) continue
    const v = log?.v?.[id]
    if (v != null && v !== '' && v !== false && v !== true) sum += Number(v)
  }
  return Math.round(sum * 10) / 10
}

// number習慣の累計（全期間）
export function totalSum(days, id) {
  let sum = 0
  for (const log of Object.values(days || {})) {
    const v = log?.v?.[id]
    if (v != null && v !== '' && v !== false && v !== true) sum += Number(v)
  }
  return Math.round(sum * 10) / 10
}

// check習慣の達成日数
export function monthDoneCount(days, id, month) {
  const m = ym(month)
  let n = 0
  for (const [date, log] of Object.entries(days || {})) {
    if (date.startsWith(m) && log?.v?.[id] === true) n++
  }
  return n
}

// number習慣の最新値
export function latestVal(days, id) {
  const dates = Object.keys(days || {}).filter(d => {
    const v = days[d]?.v?.[id]
    return v != null && v !== '' && v !== false && v !== true
  }).sort()
  const last = dates[dates.length - 1]
  return last ? Number(days[last].v[id]) : null
}

// number習慣の時系列（グラフ用）
export function numberSeries(days, id) {
  return Object.keys(days || {})
    .filter(d => {
      const v = days[d]?.v?.[id]
      return v != null && v !== '' && v !== false && v !== true
    })
    .sort()
    .map(d => ({ date: d.slice(5), value: Number(days[d].v[id]) }))
}

// 禁煙：節約額・本数
export function smokingStats(days, id = 'no-smoke') {
  const streak = checkStreak(days, id)
  const cigsAvoided = streak * SMOKING.cigsPerDayBefore
  const yenPerCig = SMOKING.pricePerPack / SMOKING.cigsPerPack
  const saved = Math.round(cigsAvoided * yenPerCig)
  return { days: streak, cigsAvoided, saved }
}

export function yen(n) {
  return '¥' + Math.round(n).toLocaleString('ja-JP')
}

// number習慣の値をセル用に短く整形（円→k表記）
export function shortNum(habit, v) {
  if (v == null || v === '') return ''
  const n = Number(v)
  if (habit.unit === '円') return (Math.round(n / 100) / 10) + 'k'
  return String(n)
}

// number習慣の入力ステップ（単位から推定）
export function stepFor(habit) {
  if (habit.unit === '円') return 1000
  if (habit.unit === 'kg') return 0.1
  if (habit.unit === 'h') return 0.5
  return 1
}
