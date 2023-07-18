import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from '@ioc:Adonis/Core/Event'
import { DateTime } from 'luxon'
import { successResponse } from '../../../utils/helper'
import ForgotPasswordValidator from 'App/Validators/ForgotPasswordValidator'
import User from 'App/Models/User'
import ResetPasswordValidator from 'App/Validators/ResetPasswordValidator'
import LoginValidator from 'App/Validators/LoginValidator'
import RegistrationValidator from 'App/Validators/RegistrationValidator'

export default class AuthController {
  public async login({ auth, request }: HttpContextContract) {
    const { email, password } = await request.validate(LoginValidator)

    const result = await auth.use('api').attempt(email, password)

    result.user.lastLoginAt = DateTime.local()
    await result.user.save()

    return {
      ...result.user.toJSON(),
      token: result.token,
    }
  }

  public async register(ctx: HttpContextContract) {
    const requestData = await ctx.request.validate(RegistrationValidator)

    const user = await User.create(requestData)

    const code = Date.now().toString().slice(-6)

    await user.related('verifications').create({
      code,
    })

    Event.emit('mail:welcome', { user, code })

    return this.login(ctx)
  }

  public async logout(ctx: HttpContextContract) {
    await ctx.auth.use('api').revoke()
    return {}
  }

  public async forgotPassword(ctx: HttpContextContract) {
    const { email } = await ctx.request.validate(ForgotPasswordValidator)

    const userMail = email.toLowerCase()

    const user = await User.findByOrFail('email', userMail)

    await user.load('password_resets', (resets) => {
      resets.delete()
    })

    const code = Date.now().toString().slice(-6)

    user.related('password_resets').create({
      code,
      expiresAt: DateTime.now().plus({ minutes: 10 }),
    })

    Event.emit('mail:forgot-password', { user, code })

    return successResponse('A password reset instruction has been sent to your email.', email)
  }

  public async resetPassword(ctx: HttpContextContract) {
    // Validates if the code is valid & exists, and password against password policy
    const { email, code, password } = await ctx.request.validate(ResetPasswordValidator)

    const user = await User.findByOrFail('email', email)

    await user.load('password_resets', (resets) => {
      resets.where('code', code)
    })

    // Get password record by the supplied reset code
    const passwordReset = user.password_resets[0]

    // Check if the reset token is not expired
    if (DateTime.now() > passwordReset.expiresAt) {
      return ctx.response.unprocessableEntity({
        status: false,
        errors: [
          {
            rule: 'expired_at',
            field: 'code',
            message: 'The password reset code expired, please request a new one.',
          },
        ],
      })
    }

    // Load the related user record
    await passwordReset.load('user')

    // Update user password
    user.password = password

    // Saved the modified user payload
    await user.save()

    // Trigger event to send password reset notification email
    Event.emit('mail:forgot-password-reset', { user })

    // delete the password reset record
    await passwordReset.delete()

    // return empty data
    return {}
  }
}
