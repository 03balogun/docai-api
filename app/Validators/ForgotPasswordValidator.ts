import { rules, schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default class ForgotPasswordValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = ValidationReporter

  public schema = schema.create({
    email: schema.string({ trim: true }, [
      rules.email({ sanitize: true }),
      rules.normalizeEmail({
        allLowercase: true,
      }),
      rules.exists({ table: 'users', column: 'email' }),
    ]),
  })

  public messages = {
    required: '{{ field }} is required to receive password reset code.',
    exists: 'Invalid {{ field }}',
  }
}
