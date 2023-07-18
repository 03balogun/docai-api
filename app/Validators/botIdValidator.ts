import { rules, schema, validator } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default (ctx: HttpContextContract) => {
  return validator.validate({
    reporter: ValidationReporter,
    schema: schema.create({
      botId: schema.string([
        rules.uuid({ version: 4 }),
        rules.exists({
          table: 'bots',
          column: 'id',
          where: { user_id: ctx.auth.user!.id, deleted_at: null },
        }),
      ]),
    }),
    data: { botId: ctx.request.params().botId },
    messages: {
      required: '{{ field }} is required.',
      exists: 'Invalid {{ field }}.',
    },
  })
}
