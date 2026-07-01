// ========================================================
// STELLA COMMAND - 初期設定
// ここの数字を書き換えれば、目標やタスクを変えられる
// ========================================================

// 今日の最優先ミッション（毎朝ここを書き換える運用でもOK）
export const DEFAULT_MISSION = 'Uber 6時間稼働 → 生存資金を確保する'

// 毎日のタスク（テンプレ）。cat はカテゴリで色分けに使う
//   survive=生存(金) / future=未来(FX) / health=健康 / study=勉強
export const DAILY_TEMPLATE = [
  { id: 'uber',    name: 'Uber 6時間稼働',       meta: '目標 売上15,000円', cat: 'survive' },
  { id: 'fx',      name: 'FX 分析 2時間（エントリー禁止）', meta: 'ライン引き・技術のみ', cat: 'future' },
  { id: 'study',   name: '宅建 勉強',            meta: '2時間',            cat: 'study' },
  { id: 'workout', name: '筋トレ',               meta: '範馬刃牙',          cat: 'health' },
  { id: 'realestate', name: '不動産 案件チェック',  meta: 'ゼロにしない程度',   cat: 'survive' },
]

// やらないことリスト（守りの管理）。連続日数を数える
export const AVOID_TEMPLATE = [
  { id: 'no-trade', name: 'FXエントリーしない',  unit: '日' },
  { id: 'no-smoke', name: 'タバコを吸わない',    unit: '日' },
]

// 期限のあるもの（カウントダウン表示）。dateは "YYYY-MM-DD"
export const DEADLINES = [
  { id: 'takken', name: '宅建試験', date: '2026-10-18' },
]

// 目標値（ダッシュボードの計算に使う）
export const TARGETS = {
  uberHoursPerDay: 6,
  uberDaysPerMonth: 20,
  uberHourlyYen: 2500,
  uberMonthlyYen: 300000,
  fxAnalysisHours: 2,
  studyHoursPerDay: 2,
  studyTotalTarget: 300,  // 宅建合格までの総勉強時間の目安
}

// 禁煙の節約計算用
export const SMOKING = {
  pricePerPack: 600,      // 1箱の値段(円)
  cigsPerPack: 20,        // 1箱の本数
  cigsPerDayBefore: 20,   // 禁煙前に吸っていた1日の本数
}

// 初期状態（localStorageに何もない時に使う土台）
export function buildInitialState() {
  return {
    version: 1,
    mission: DEFAULT_MISSION,
    missionDone: false,
    // 編集可能なタスク（設定画面でいじれる）
    tasks: DAILY_TEMPLATE.map(t => ({ ...t })),
    // 日付ごとのログ: { "2026-07-01": { tasks:{uber:true,...}, avoid:{'no-smoke':true,...} } }
    days: {},
    // 計測ログ（グラフ用）: [{date, weight, sleep, uberSales, uberHours, studyMin}]
    metrics: [],
    // メモ
    memo: '',
    // 月間固定費・支出（手入力）
    money: { fixedCost: 0, monthSpend: 0 },
    // 目標値（設定画面で変更可）
    targets: {
      uberMonthlyYen: TARGETS.uberMonthlyYen,
      uberHourlyYen: TARGETS.uberHourlyYen,
    },
  }
}

// 新しいタスク用のID生成
export function newTaskId() {
  return 't' + Date.now().toString(36)
}

// カテゴリの選択肢（編集UI用）
export const CATEGORIES = [
  { id: 'survive', label: '生存(金)', color: 'var(--gold)' },
  { id: 'future',  label: '未来(FX)', color: 'var(--blue)' },
  { id: 'health',  label: '健康',     color: 'var(--green)' },
  { id: 'study',   label: '勉強',     color: 'var(--accent)' },
]

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
