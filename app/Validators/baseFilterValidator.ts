import { rules, schema, validator } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default (ctx: HttpContextContract) => {
  return validator.validate({
    reporter: ValidationReporter,
    schema: schema.create({
      page: schema.number.optional([rules.unsigned()]),
      limit: schema.number.optional([rules.unsigned(), rules.range(1, 20)]),
      botId: schema.string.optional([
        rules.uuid({ version: 4 }),
        rules.exists({
          table: 'bots',
          column: 'id',
          where: { user_id: ctx.auth?.user?.id, deleted_at: null },
        }),
      ]),
    }),
    data: ctx.request.qs(),
    messages: {
      number: '{{ field }} must be a number.',
      exists: 'Invalid {{ field }}.',
    },
  })
}
