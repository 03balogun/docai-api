import fs from 'fs'
import axios from 'axios'

export const successResponse = <T>(message: string, data: T = {} as T) => {
  return {
    status: true,
    message,
    data,
  }
}

export const deleteFiles = async (path: string) => {
  try {
    const isExistingPath = fs.existsSync(path)
    if (isExistingPath) {
      fs.rmSync(path, { recursive: true })
    }
  } catch (e) {
    console.error('[removeFile]', e)
  }
}

export const loadHTML = async (url: string): Promise<string> => {
  return (
    await axios.get(url, {
      headers: {
        // Web browser user agent
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
    })
  ).data
}

export const getAvatar = async (name: string) => {
  return `https://api.dicebear.com/6.x/bottts/svg?seed=${name}`
}
