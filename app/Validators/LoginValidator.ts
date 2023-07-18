import { rules, schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default class LoginValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = ValidationReporter

  public schema = schema.create({
    email: schema.string([
      rules.trim(),
      rules.maxLength(255),
      rules.email(),
      rules.normalizeEmail({
        allLowercase: true,
      }),
    ]),
    password: schema.string({}),
  })

  public messages = {
    required: '{{ field }} is required',
  }
}
