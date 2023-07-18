/**
 * Contract source: https://git.io/JfefG
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

declare module '@ioc:Adonis/Core/Event' {
  /*
  |--------------------------------------------------------------------------
  | Define typed events
  |--------------------------------------------------------------------------
  |
  | You can define types for events inside the following interface and
  | AdonisJS will make sure that all listeners and emit calls adheres
  | to the defined types.
  |
  | For example:
  |
  | interface EventsList {
  |   'new:user': UserModel
  | }
  |
  | Now calling `Event.emit('new:user')` will statically ensure that passed value is
  | an instance of the the UserModel only.
  |
  */
  import Bot from 'App/Models/Bot'
  import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
  import User from 'App/Models/User'

  interface EventsList {
    //
    'ingest:documents': { bot: Bot; documents: MultipartFileContract[] }
    'ingest:website': { bot: Bot; urls: string[] }
    'mail:welcome': { user: User; code: string }
    'mail:forgot-password': { user: User; code: string }
    'mail:forgot-password-reset': { user: User }
  }
}
