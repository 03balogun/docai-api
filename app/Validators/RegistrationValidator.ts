import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default class RegistrationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = ValidationReporter

  public schema = schema.create({
    name: schema.string([rules.maxLength(255), rules.trim()]),
    email: schema.string([
      rules.trim(),
      rules.maxLength(255),
      rules.email({ allowIpDomain: false, hostBlacklist: [''] }),
      rules.normalizeEmail({
        allLowercase: true,
      }),
      rules.unique({ table: 'users', column: 'email' }),
    ]),
    password: schema.string({}, [
      rules.minLength(5),
      rules.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/),
    ]),
  })

  public messages = {
    'required': 'The {{ field }} field required.',
    'email.unique': 'Email has already been used.',
    'password.regex':
      'Password must contain at least six characters, an uppercase letter, a lowercase letter, a number and a special character.',
  }
}
