import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default class ResetPasswordValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = ValidationReporter

  public schema = schema.create({
    email: schema.string({ trim: true }, [
      rules.email({ sanitize: true }),
      rules.exists({ table: 'users', column: 'email' }),
    ]),
    code: schema.string({}, [
      rules.maxLength(6),
      rules.minLength(6),
      rules.exists({ table: 'password_resets', column: 'code' }),
    ]),
    password: schema.string({}, [
      rules.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{6,}$/),
      rules.confirmed(),
    ]),
  })

  public messages = {
    'required': '{{ field }} is required.',
    'confirmed': 'Passwords do not match.',
    'exists': 'Invalid {{ field }}.',
    'password.regex':
      'Password must contain at least six characters, an uppercase letter, a lowercase letter, a number and a special character..',
  }
}
