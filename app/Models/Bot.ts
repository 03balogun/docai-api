import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  beforeSave,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import Document from 'App/Models/Document'

export default class Bot extends BaseModel {
  public static selfAssignPrimaryKey = true

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @hasMany(() => Document)
  public documents: HasMany<typeof Document>

  @column()
  public userId: string

  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column()
  public description: string

  @column()
  public avatar: string

  @column({ serializeAs: null })
  public meta: {
    isPublic: boolean
    [key: string]: any
  }

  @column()
  public dataType: 'documents' | 'website'

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(bot: Bot) {
    bot.id = uuidv4()
  }

  @beforeSave()
  public static updateMeta(bot: Bot) {
    if (bot.$dirty.meta) {
      bot.meta = {
        ...bot.meta,
        ...bot.$dirty.meta,
      }
    }
  }
}
