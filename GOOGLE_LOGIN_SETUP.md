# Google 登錄設置指南

## 環境變數配置

請在您的 `.env` 文件中添加以下環境變數：

```env
# Google OAuth
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## Google Cloud Console 設置步驟

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新項目或選擇現有項目
3. 在側邊欄中，點擊「API 和服務」→「憑證」
4. 點擊「+ 創建憑證」→「OAuth 2.0 客戶端 ID」
5. 選擇應用程式類型為「Web 應用程式」
6. 在「已授權的 JavaScript 來源」中添加：
   - `http://localhost:3000`（開發環境）
   - 您的生產環境網域
7. 在「已授權的重新導向 URI」中添加：
   - `http://localhost:3000`（開發環境）
   - 您的生產環境網域
8. 點擊「建立」
9. 複製生成的「客戶端 ID」並將其設置為環境變數

## 使用方式

Google 登錄按鈕已經添加到首頁，當用戶點擊後：

1. 會顯示 Google 登錄彈窗
2. 用戶選擇 Google 帳戶進行授權
3. 成功後會將 JWT token 發送到後端 API (`/api/auth/google`)
4. 後端會解碼 token 並返回用戶資訊

## 安全注意事項

- 目前的實現僅用於開發環境
- 在生產環境中，請使用 Google 的公鑰來驗證 JWT 簽名
- 考慮實現用戶 session 管理和資料庫集成
- 添加適當的錯誤處理和日誌記錄

## 自定義選項

您可以通過修改 `pages/index.vue` 中的 Google 登錄按鈕樣式來自定義外觀，或者在 `handleGoogleResponse` 函數中添加更多登錄後的處理邏輯。
