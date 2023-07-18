import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  beforeSave,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Bot from 'App/Models/Bot'
import Hash from '@ioc:Adonis/Core/Hash'
import PasswordReset from 'App/Models/PasswordReset'
import Verification from 'App/Models/Verification'

export default class User extends BaseModel {
  public static selfAssignPrimaryKey = true

  @hasMany(() => PasswordReset)
  public password_resets: HasMany<typeof PasswordReset>

  @hasMany(() => Verification)
  public verifications: HasMany<typeof Verification>

  @column({ isPrimary: true })
  public id: string

  @hasMany(() => Bot)
  public bots: HasMany<typeof Bot>

  @column()
  public name: string

  @column()
  public username: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public avatar: string

  @column()
  public provider: string

  @column({ serializeAs: null })
  public password: string

  @column.dateTime({ serializeAs: null })
  public lastLoginAt: DateTime

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(user: User) {
    console.log('[user.id]', user.id)
    user.id = uuidv4()
  }

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
