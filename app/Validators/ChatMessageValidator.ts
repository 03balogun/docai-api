import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ChatMessageValidator {
  public reporter = ValidationReporter

  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    message: schema.string([rules.trim(), rules.maxLength(1000)]),
    botId: schema.string([
      rules.uuid({ version: 4 }),
      rules.exists({ table: 'bots', column: 'id' }),
    ]),
    sessionId: schema.string.optional([rules.uuid({ version: 4 })]),
  })

  public messages: CustomMessages = {
    'message.required': 'Please enter a message.',
    'message.maxLength': 'The message must be less than 1000 characters.',
    'botId.required': 'Please provide a bot.',
    'botId.uuid': 'Invalid bot.',
    'botId.exists': 'Invalid bot.',
    'sessionId.uuid': 'Invalid session.',
  }
}
