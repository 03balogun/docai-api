/*
 * @adonisjs/validator
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {
  ApiErrorNode,
  MessagesBagContract,
  ErrorReporterContract,
  ValidationException,
} from '@ioc:Adonis/Core/Validator'

/**
 * The API Error reporter formats messages as an array of objects
 */
export class ValidationReporter implements ErrorReporterContract<{ errors: ApiErrorNode[] }> {
  private errors: ApiErrorNode[] = []

  /**
   * A boolean to know if an error has been reported or
   * not
   */
  public hasErrors = false

  constructor(private messages: MessagesBagContract, private bail: boolean) {}

  /**
   * Report a new error
   */
  public report(
    pointer: string,
    rule: string,
    message: string,
    arrayExpressionPointer?: string,
    args?: any
  ) {
    this.hasErrors = true

    this.errors.push({
      rule,
      field: pointer,
      message: this.messages.get(pointer, rule, message, arrayExpressionPointer, args),
      // ...(args ? { args } : {}),
    })

    /**
     * Raise exception right away when `bail=true`.
     */
    if (this.bail) {
      throw this.toError()
    }
  }

  /**
   * Returns an instance of [[ValidationException]]
   */
  public toError() {
    return new ValidationException(false, this.toJSON())
  }

  /**
   * Return errors
   */
  public toJSON() {
    return {
      status: false,
      errors: this.errors,
    }
  }
}
