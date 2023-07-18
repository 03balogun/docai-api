import { JobContract } from '@ioc:Rocketseat/Bull'
import { deleteFiles } from '../../utils/helper'

import Bot from 'App/Models/Bot'
import Application from '@ioc:Adonis/Core/Application'
import langChainService from '@ioc:Services/LangChainService'

export default class IngestDocument implements JobContract {
  public key = 'IngestDocument'

  public async handle(job) {
    const { data } = job
    const bot = await Bot.findOrFail(data.botId)

    try {
      const docPath = Application.tmpPath(`documents/${bot.id}`)

      await langChainService.storeFileDocuments(bot.id, docPath)

      await Promise.all([
        deleteFiles(docPath),
        bot.related('documents').query().update({ trainingStatus: 'completed' }),
      ])

      // TODO: Notify the user that the document has been indexed
    } catch (error) {
      console.error('[IngestDocument-Queue]', error)

      await bot
        .related('documents')
        .query()
        .update({
          trainingStatus: 'failed',
          meta: {
            error: {
              message: error.message,
            },
          },
        })

      throw error
    }
  }
}
