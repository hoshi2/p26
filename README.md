# STELLA COMMAND

人生立て直しのための司令塔アプリ。
今日やることに集中し、数字と行動で前に進むためのツール。

財務管理（借金・FX資金など）は STELLA FINANCE 側に任せる設計。
こっちは「今日を動かす」ことに特化している。

---

## 画面

- **今日** … 最優先ミッション / タスクのチェック / やらないこと / メモ
- **司令室** … ストリーク・達成率・Uber/勉強/健康のステータス・期限カウントダウン
- **記録** … 体重・睡眠・Uber売上・勉強時間の入力＋グラフ
- **設定** … ミッション編集・お金・バックアップ/復元

---

## 動かし方（ローカルで確認）

```
npm install
npm run dev
```

出てきた `http://localhost:5173/` をブラウザで開く。

---

## 公開する（GitHub Pages 自動デプロイ）

STELLA FINANCE と同じ仕組み。`main` に push すると `.github/workflows/deploy.yml`
が自動でビルド＆公開する。

1. GitHubで新しいリポジトリを作る（例：`stella-command`）
2. このフォルダを push
3. リポジトリの Settings → Pages → Source を「GitHub Actions」にする
4. 数分待つと公開URLが出る

---

## カスタマイズ

タスク内容・目標・期限・禁煙設定は全部 `src/data/initialData.js` にある。
ここの数字を書き換えるだけでアプリの中身が変わる。

- `DAILY_TEMPLATE` … 毎日のタスク
- `AVOID_TEMPLATE` … やらないことリスト
- `DEADLINES` … 期限カウントダウン（宅建試験など）
- `TARGETS` … Uber目標・勉強目標
- `SMOKING` … 禁煙の節約計算

---

## データ・バックアップ

- データはブラウザの localStorage に **自動保存**（リロードしても消えない）
- スマホ↔PC同期 / 機種変の復元は「設定」タブの **書き出し / 読み込み** で行う
- 書き出したJSONを OneDrive に置けば、両方の端末から復元できる

> 段階1は localStorage + 手動バックアップ。
> 慣れてきたら段階2で Firebase + Googleログインの自動同期に拡張できる。
