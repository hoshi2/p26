// ========================================================
// STELLA COMMAND - 初期設定（v2：習慣グリッド統一モデル）
// ========================================================

// 今日の最優先ミッション
export const DEFAULT_MISSION = 'Uber 6時間稼働 → 生存資金を確保する'

// 習慣テンプレ（設定画面で自由に追加・変更・削除できる）
//   type: 'check'  … ✓/✗ の2択（筋トレ・FX・禁煙 など）
//         'number' … 数値入力（Uber売上・宅建時間・体重 など）
//   unit   … number のときの単位（円 / h / kg …）
//   target … 1日の目標（達成判定に使う。空なら「記録するだけ」）
//   cat    … 色分けカテゴリ
export const HABIT_TEMPLATE = [
  { id: 'uber',     name: 'Uber',   type: 'number', unit: '円', target: 15000, cat: 'survive' },
  { id: 'study',    name: '宅建',   type: 'number', unit: 'h',  target: 2,     cat: 'study'   },
  { id: 'workout',  name: '筋トレ', type: 'check',  cat: 'health' },
  { id: 'fx',       name: 'FX分析', type: 'check',  hint: 'エントリーしない', cat: 'future' },
  { id: 'no-smoke', name: '禁煙',   type: 'check',  hint: 'タバコ吸わない',   cat: 'health' },
  { id: 'weight',   name: '体重',   type: 'number', unit: 'kg', cat: 'health' },
  { id: 'sleep',    name: '睡眠',   type: 'number', unit: 'h',  cat: 'health' },
]

// 期限のあるもの（カウントダウン表示）
export const DEADLINES = [
  { id: 'takken', name: '宅建試験', date: '2026-10-18' },
]

// ダッシュボードの参考値
export const TARGETS = {
  uberDaysPerMonth: 20,
  uberHourlyYen: 2500,
  uberMonthlyYen: 300000,
  studyTotalTarget: 300,  // 宅建合格までの総勉強時間の目安
}

// 禁煙の節約計算用
export const SMOKING = {
  pricePerPack: 600,
  cigsPerPack: 20,
  cigsPerDayBefore: 20,
}

// カテゴリの選択肢（編集UI用）
export const CATEGORIES = [
  { id: 'survive', label: '生存(金)', color: 'var(--gold)' },
  { id: 'future',  label: '未来(FX)', color: 'var(--blue)' },
  { id: 'health',  label: '健康',     color: 'var(--green)' },
  { id: 'study',   label: '勉強',     color: 'var(--accent)' },
]

export function catColor(cat) {
  return (CATEGORIES.find(c => c.id === cat) || {}).color || 'var(--text3)'
}

// 初期状態（localStorageに何もない時の土台）
//   days: { "2026-07-01": { v: { habitId: 値 } } }
//     check   → true / false
//     number  → 数値
export function buildInitialState() {
  return {
    version: 2,
    mission: DEFAULT_MISSION,
    habits: HABIT_TEMPLATE.map(h => ({ ...h })),
    days: {},
    memo: '',
    money: { fixedCost: 0, monthSpend: 0 },
    targets: {
      uberMonthlyYen: TARGETS.uberMonthlyYen,
      uberHourlyYen: TARGETS.uberHourlyYen,
    },
  }
}

// 新しい習慣用のID生成
export function newHabitId() {
  return 'h' + Date.now().toString(36)
}

// 古い保存データ（v1）を新形式（v2）へ変換。データを失わないための橋渡し。
export function migrateState(s) {
  if (!s) return null
  if (s.version >= 2) {
    if (!s.habits) s.habits = HABIT_TEMPLATE.map(h => ({ ...h }))
    if (!s.targets) s.targets = { uberMonthlyYen: TARGETS.uberMonthlyYen, uberHourlyYen: TARGETS.uberHourlyYen }
    return s
  }

  // ---- v1 → v2 ----
  const days = {}
  const ensure = (date) => (days[date] || (days[date] = { v: {} }))

  // 旧 days（tasks / avoid）
  for (const [date, log] of Object.entries(s.days || {})) {
    const v = ensure(date).v
    if (log.tasks && 'workout' in log.tasks) v.workout = !!log.tasks.workout
    if (log.tasks && 'fx' in log.tasks) v.fx = !!log.tasks.fx
    if (log.avoid && 'no-smoke' in log.avoid) v['no-smoke'] = log.avoid['no-smoke']
  }

  // 旧 metrics（数値）
  for (const m of (s.metrics || [])) {
    if (!m || !m.date) continue
    const v = ensure(m.date).v
    if (m.uberSales != null && m.uberSales !== '') v.uber = Number(m.uberSales)
    if (m.studyMin != null && m.studyMin !== '') v.study = Math.round(Number(m.studyMin) / 6) / 10
    if (m.weight != null && m.weight !== '') v.weight = Number(m.weight)
    if (m.sleep != null && m.sleep !== '') v.sleep = Number(m.sleep)
  }

  return {
    version: 2,
    mission: s.mission ?? DEFAULT_MISSION,
    habits: HABIT_TEMPLATE.map(h => ({ ...h })),
    days,
    memo: s.memo ?? '',
    money: s.money ?? { fixedCost: 0, monthSpend: 0 },
    targets: s.targets ?? { uberMonthlyYen: TARGETS.uberMonthlyYen, uberHourlyYen: TARGETS.uberHourlyYen },
  }
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
