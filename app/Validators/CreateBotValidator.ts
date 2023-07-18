import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default class CreateBotValidator {
  public reporter = ValidationReporter

  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string([
      rules.maxLength(25),
      rules.trim(),
      rules.escape(),
      rules.unique({ table: 'bots', column: 'name' }),
    ]),
    description: schema.string([rules.maxLength(250)]),
    avatar: schema.string.optional({ trim: true }, [rules.url({ protocols: ['http', 'https'] })]),
    dataType: schema.enum(['documents', 'website'] as const),
    documents: schema.array
      .optional([rules.maxLength(5), rules.requiredWhen('dataType', '=', 'documents')])
      .members(
        schema.file({
          size: '5mb',
          extnames: ['pdf', 'docx', 'doc', 'txt'],
        })
      ),
    urls: schema.array
      .optional([rules.maxLength(5), rules.requiredWhen('dataType', '=', 'website')])
      .members(
        schema.string([
          rules.url({
            protocols: ['http', 'https'],
          }),
          rules.normalizeUrl(),
        ])
      ),
  })

  public messages: CustomMessages = {
    'name.required': 'Please enter a name for this chat bot.',
    'name.maxLength': 'The name must be less than 100 characters.',
    'description.maxLength': 'The description must be less than 250 characters.',
    'avatar.url': 'Please enter a valid url.',
    'avatar.required': 'Please enter a url for the avatar.',
    'dataType.required': 'Please select a data type.',
    'dataType.enum': 'Please select a valid data type.',
    'name.unique': 'You have an existing chat bot with this name, please choose a different name.',
    'documents.requiredWhen': 'Please upload pdf, doc, docx, or txt files',
    'documents.maxLength': 'You can only upload up to 5 documents',
    'urls.requiredWhen': 'Please add valid web page urls',
    'urls.maxLength': 'You can only add up to 5 urls',
  }
}
