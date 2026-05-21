# VALORANT Discord 每日商店推播（常駐免費版）

這個專案使用 GitHub Actions 每天自動執行，不需要你自己電腦常駐。

## 目前支援的資料來源

1. `henrik-featured`（預設）
- 來源是 HenrikDev 的 Featured Store（不是個人帳號專屬商店）
- 穩定、好上線

2. `custom`
- 你可以接自己的商店 API
- 你的 API 要回傳 JSON 格式：

```json
{
  "title": "VALORANT 每日商店更新",
  "subtitle": "My Account",
  "offers": [
    { "name": "Skin A", "price": 1775, "discount": 0 }
  ]
}
```

## 你要做的事

1. 建 GitHub repo，然後把這個資料夾推上去。
2. 到 repo 的 `Settings -> Secrets and variables -> Actions`，新增 secrets：
- `DISCORD_BOT_TOKEN`
- `DISCORD_CHANNEL_ID`（你給的頻道 ID）
- `STORE_PROVIDER`（先填 `henrik-featured`）
- `HENRIK_API_KEY`（到 HenrikDev 申請）

3. 到 `Actions` 頁面，手動跑一次 `Daily Valorant Store Push`（workflow_dispatch）。
4. 確認 Discord 頻道有收到訊息。

## 排程時間

- 工作流 cron: `5 0 * * *`（UTC）
- 台北時間約每天 `08:05`

## 本機測試（可選）

PowerShell:

```powershell
$env:DISCORD_BOT_TOKEN="你的token"
$env:DISCORD_CHANNEL_ID="你的channel"
$env:STORE_PROVIDER="henrik-featured"
$env:HENRIK_API_KEY="你的henrik key"
node src/index.js
```

## 安全提醒

- `DISCORD_BOT_TOKEN` 請只放在 GitHub Secrets。
- 你之前在聊天室貼過 token，建議功能確認後立刻到 Discord Developer Portal 重設一次。
