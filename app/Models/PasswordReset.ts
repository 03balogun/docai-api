import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import { v4 as uuidv4 } from 'uuid'

export default class PasswordReset extends BaseModel {
  public static selfAssignPrimaryKey = true

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column({ isPrimary: true })
  public id: string

  @column({ serializeAs: null })
  public userId: number

  @column({ serializeAs: null })
  public code: string

  @column.dateTime()
  public expiresAt: DateTime

  @column.dateTime()
  public completedAt: DateTime

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(pwdReset: PasswordReset) {
    pwdReset.id = uuidv4()
  }
}
