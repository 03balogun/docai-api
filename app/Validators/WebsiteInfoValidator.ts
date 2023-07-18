import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ValidationReporter } from 'App/Validators/Reporters/ValidationReporter'

export default class WebsiteInfoValidator {
  public reporter = ValidationReporter

  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    sourceType: schema.enum(['single', 'multiple'] as const),
    url: schema.string([
      rules.url({
        protocols: ['http', 'https'],
      }),
      rules.normalizeUrl(),
    ]),
  })

  public messages: CustomMessages = {
    'sourceType.required': 'Please select a source type.',
    'url.required': 'Please enter a url.',
    'url.url': 'Please enter a valid url.',
  }
}
