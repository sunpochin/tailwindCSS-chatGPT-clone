import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig();
  const recaptchaResponse = body.recaptchaResponse;
  
  if (!recaptchaResponse) {
    return { success: false, message: '未提供 CAPTCHA 回應' };
  }
  
  // 向 Google reCAPTCHA API 驗證
  const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
  const response = await fetch(verificationURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: config.recaptchaSecretKey,
      response: recaptchaResponse
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    return { success: true, message: 'CAPTCHA 驗證成功' };
  } else {
    return { success: false, message: 'CAPTCHA 驗證失敗', errors: data['error-codes'] };
  }
});
