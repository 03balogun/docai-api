import { AuthenticationException } from '@adonisjs/auth/build/standalone'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AuthException extends AuthenticationException {
  /**
   * Send response as an array of errors
   */
  protected respondWithJson(ctx: HttpContextContract) {
    ctx.response.status(this.status).send({
      status: false,
      message: this.message,
    })
  }
}
