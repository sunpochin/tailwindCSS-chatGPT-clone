/**
 * @file Google 登錄驗證 API
 * @description 處理 Google OAuth 登錄請求
 */

import { defineEventHandler, readBody, createError } from 'h3'

interface GoogleCredential {
  credential: string
}

interface GoogleTokenPayload {
  iss: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name: string
  family_name: string
  iat: number
  exp: number
}

export default defineEventHandler(async (event) => {
  try {
    // 只接受 POST 請求
    if (event.node.req.method !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed',
      })
    }

    const body = await readBody<GoogleCredential>(event)

    if (!body.credential) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing Google credential',
      })
    }

    // 簡單的 JWT 解碼 (僅用於開發環境)
    // 在生產環境中，應該使用 Google 的公鑰來驗證簽名
    try {
      const parts = body.credential.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      const payload = parts[1]
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString()
      ) as GoogleTokenPayload

      // 驗證 token 是否過期
      const now = Math.floor(Date.now() / 1000)
      if (decoded.exp < now) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Google credential has expired',
        })
      }

      console.log('Google 用戶登錄:', {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      })

      // 返回成功回應
      return {
        success: true,
        user: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          email_verified: decoded.email_verified,
        },
        message: '登錄成功',
      }
    } catch (decodeError) {
      console.error('JWT 解碼錯誤:', decodeError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid Google credential format',
      })
    }
  } catch (error) {
    console.error('Google 登錄驗證錯誤:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
