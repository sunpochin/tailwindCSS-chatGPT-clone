/**
 * @description 將File對象轉換為base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * @description 從PDF文件中提取文本 (伺服器端處理)
 * @param {File} file - 用戶上傳的PDF文件
 * @returns {Promise<string>} 提取的文本內容
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // 確保檔案是 PDF
    if (!file.type.includes('pdf')) {
      throw new Error('請上傳 PDF 檔案');
    }
    
    // 轉換檔案為base64
    const base64Data = await fileToBase64(file);
    
    // 發送到伺服器處理
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdf: base64Data }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '伺服器處理PDF失敗');
    }
    
    return result.text;
  } catch (error) {
    console.error('PDF文本提取錯誤:', error);
    throw new Error(`無法提取PDF文本: ${error.message}`);
  }
}

/**
 * @description 將提取的PDF文本轉換為系統提示(System Prompt)
 * @param {string} pdfText - 從PDF提取的文本
 * @returns {string} 格式化的系統提示
 */
export function createSystemPromptFromPDF(pdfText: string): string {
  const prompt = `以下是參考文檔的內容，請基於此回答相關問題：\n\n${pdfText}`;
  const maxLength = 4000; // 根據實際API限制調整
  if (prompt.length > maxLength) {
    return prompt.substring(0, maxLength) + '...';
  }
  return prompt;
}
