/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
|
| AdonisJs will forward all exceptions occurred during an HTTP request to
| the following class. You can learn more about exception handling by
| reading docs.
|
| The exception handler extends a base `HttpExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ExceptionHandler extends HttpExceptionHandler {
  public async handle(error, ctx: HttpContextContract) {
    if (error.message.startsWith('E_INVALID_AUTH_UID')) {
      return ctx.response.status(401).send({
        status: false,
        message: 'Invalid login credentials.',
      })
    }

    return super.handle(error, ctx)
  }
  protected context(ctx: HttpContextContract) {
    return {
      userId: ctx.auth?.user?.id,
    }
  }

  constructor() {
    super(Logger)
  }

  protected async makeJSONResponse(error, ctx: HttpContextContract) {
    if (process.env.NODE_ENV === 'development') {
      ctx.response.status(error.status).send({
        status: false,
        message: error.message,
        stack: error.stack,
        code: error.code,
      })
      return
    }

    const message =
      error.status === 500
        ? 'Oops! an error occurred from our end, please try again. If error persist contact support'
        : error.message

    ctx.response.status(error.status).send({ status: false, message })
  }
}
