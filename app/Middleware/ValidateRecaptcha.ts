import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'

export default class ValidateRecaptcha {
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    if (Env.get('NODE_ENV') === 'development') {
      return await next()
    }

    // if (request.method() !== 'POST') {
    //   return await next()
    // }

    const captchaToken = request.header('X-Recaptcha-Token')

    const errorMessage = 'Invalid captcha token, please try again'

    // validate captcha token with axios
    if (!captchaToken) {
      return response.unprocessableEntity({
        status: false,
        message: errorMessage,
      })
    }

    const secKey = Env.get('RECAPTCHA_SEC_KEY')

    const captchaResponse = (
      await axios.get(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secKey}&response=${captchaToken}`
      )
    ).data

    if (!captchaResponse?.success) {
      return response.unprocessableEntity({
        status: false,
        message: errorMessage,
      })
    }

    await next()
  }
}
