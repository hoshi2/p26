// ========================================================
// STELLA COMMAND - 初期設定（v5：Uber 金額＋時間 対応）
// ========================================================

// 習慣テンプレ（設定画面で自由に追加・変更・削除できる）
//   type: 'check'  … ✓/✗（達成率に入る）。num:true にすると数値も一緒に記録できる
//         'number' … 数値＋目標（目標以上で達成。達成率に入る）
//         'record' … 数値の記録だけ（達成率に入れない。体重など）
//   unit   … 数値の単位（円 / h / kg …）
//   target … number の1日の目標
//   num    … check のとき「数値も記録する」なら true（unit を使う）
//   sub    … number でもう1つ数値を記録するとき { unit }（Uberの時間など）
//   cat    … 色分けカテゴリ
export const HABIT_TEMPLATE = [
  { id: 'uber',     name: 'Uber',   type: 'number', unit: '円', target: 15000, sub: { unit: 'h' }, cat: 'survive' },
  { id: 'study',    name: '宅建',   type: 'check',  num: true, unit: 'h', hint: '毎日やる', cat: 'study' },
  { id: 'workout',  name: '筋トレ', type: 'check',  cat: 'health' },
  { id: 'fx',       name: 'FX分析', type: 'check',  hint: 'エントリーしない', cat: 'future' },
  { id: 'no-smoke', name: '禁煙',   type: 'check',  hint: 'タバコ吸わない',   cat: 'health' },
  { id: 'weight',   name: '体重',   type: 'record', unit: 'kg', cat: 'health' },
  { id: 'sleep',    name: '睡眠',   type: 'record', unit: 'h',  cat: 'health' },
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
  pricePerPack: 620,
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

function defTargets() {
  return { uberMonthlyYen: TARGETS.uberMonthlyYen, uberHourlyYen: TARGETS.uberHourlyYen }
}

// 初期状態
//   habitSets: { "2026-07": [ 項目... ] }   ← 月ごとに項目リストを持つ
//   days:      { "2026-07-01": { v: { habitId: 値 } } }   ← 記録は日付ごと（項目を変えても消えない）
export function buildInitialState() {
  const month = todayStr().slice(0, 7)
  return {
    version: 5,
    habitSets: { [month]: HABIT_TEMPLATE.map(h => ({ ...h })) },
    days: {},
    journal: {},
    money: { fixedCost: 0, monthSpend: 0 },
    targets: defTargets(),
  }
}

// 新しい習慣用のID生成
export function newHabitId() {
  return 'h' + Date.now().toString(36)
}

// 既定項目を新タイプへ寄せる（過去の数値はそのまま活きる）
function upgradeHabit(h) {
  if (h.id === 'study' && h.type === 'number') {
    return { ...h, type: 'check', num: true, unit: h.unit || 'h', target: undefined, hint: h.hint || '毎日やる' }
  }
  if ((h.id === 'weight' || h.id === 'sleep') && h.type === 'number') {
    return { ...h, type: 'record' }
  }
  if (h.id === 'uber' && h.type === 'number' && !h.sub) {
    return { ...h, sub: { unit: 'h' } }
  }
  return h
}

// 古い保存データ（v1〜v4）を新形式（v5）へ変換。過去データを失わないための橋渡し。
export function migrateState(s) {
  if (!s) return null
  const month = todayStr().slice(0, 7)

  // すでに v3 以上
  if (s.version >= 3) {
    if (!s.habitSets || Object.keys(s.habitSets).length === 0) {
      s.habitSets = { [month]: (s.habits || HABIT_TEMPLATE).map(h => ({ ...h })) }
    }
    if (!s.journal) s.journal = {}
    if (!s.targets) s.targets = defTargets()
    // 既定項目のタイプ更新（v5未満なら一度だけ）
    if (!(s.version >= 5)) {
      for (const m of Object.keys(s.habitSets)) {
        s.habitSets[m] = s.habitSets[m].map(upgradeHabit)
      }
      s.version = 5
    }
    return s
  }

  // days を v 形式へ
  let days = {}
  if (s.version >= 2) {
    days = s.days || {}
  } else {
    // v1 → 変換（tasks / avoid / metrics）
    const ensure = (date) => (days[date] || (days[date] = { v: {} }))
    for (const [date, log] of Object.entries(s.days || {})) {
      const v = ensure(date).v
      if (log.tasks && 'workout' in log.tasks) v.workout = !!log.tasks.workout
      if (log.tasks && 'fx' in log.tasks) v.fx = !!log.tasks.fx
      if (log.avoid && 'no-smoke' in log.avoid) v['no-smoke'] = log.avoid['no-smoke']
    }
    for (const m of (s.metrics || [])) {
      if (!m || !m.date) continue
      const v = ensure(m.date).v
      if (m.uberSales != null && m.uberSales !== '') v.uber = { n: Number(m.uberSales), n2: m.uberHours != null && m.uberHours !== '' ? Number(m.uberHours) : undefined }
      if (m.studyMin != null && m.studyMin !== '') v.study = Math.round(Number(m.studyMin) / 6) / 10
      if (m.weight != null && m.weight !== '') v.weight = Number(m.weight)
      if (m.sleep != null && m.sleep !== '') v.sleep = Number(m.sleep)
    }
  }

  const habits = (s.habits && s.habits.length ? s.habits : HABIT_TEMPLATE).map(h => ({ ...h })).map(upgradeHabit)
  const journal = {}
  if (s.memo && String(s.memo).trim()) journal[todayStr()] = String(s.memo)

  return {
    version: 5,
    habitSets: { [month]: habits },
    days,
    journal,
    money: s.money ?? { fixedCost: 0, monthSpend: 0 },
    targets: s.targets ?? defTargets(),
  }
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
