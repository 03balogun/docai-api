import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Bot from 'App/Models/Bot'

export default class Document extends BaseModel {
  public static selfAssignPrimaryKey = true

  @belongsTo(() => Bot)
  public bot: BelongsTo<typeof Bot>

  @column()
  public botId: string

  @column({ isPrimary: true })
  public id: string

  @column()
  public type: string | 'website'

  @column()
  public name: string

  @column()
  public trainingStatus: 'in_progress' | 'completed' | 'failed'

  @column({ serializeAs: null })
  public meta?: {
    info?: { [key: string]: string }
    error?: { [key: string]: string }
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(bot: Bot) {
    bot.id = uuidv4()
  }
}
