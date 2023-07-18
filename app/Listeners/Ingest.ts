import type { EventsList } from '@ioc:Adonis/Core/Event'
import Application from '@ioc:Adonis/Core/Application'
import Bull from '@ioc:Rocketseat/Bull'
import IngestDocument from 'App/Jobs/IngestDocument'
import Document from 'App/Models/Document'
import IngestWebsite from 'App/Jobs/IngestWebsite'
import Bot from 'App/Models/Bot'

export default class Ingest {
  /**
   * Handle the ingest:documents event.
   * @param payload
   */
  public async onIngestDocuments(payload: EventsList['ingest:documents']) {
    const { bot, documents } = payload

    const documentsData: {
      type: string
      name: string
      trainingStatus: string
    }[] = []

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i]

      const fileName =
        document.clientName.length > 100
          ? `${document.clientName.substring(0, 95)}.${document.extname}`
          : document.clientName

      // move the file to the bots tmp directory
      await document.move(Application.tmpPath(`documents/${bot.id}`), {
        name: `${fileName}.${document.extname}`,
      })

      // return the document data
      documentsData.push({
        type: document.extname!,
        name: fileName,
        trainingStatus: 'in_progress',
      })
    }

    // save the documents
    await bot.related('documents').createMany(documentsData as Document[])

    // create a job to ingest the documents
    await Ingest.scheduleIngestJob('document', bot)
  }

  public async onIngestWebsite(payload: EventsList['ingest:website']) {
    const { bot, urls } = payload

    const documentsData = urls.map((url) => ({
      type: 'website',
      name: url,
      trainingStatus: 'in_progress',
    }))

    await bot.related('documents').createMany(documentsData as Document[])

    // create a job to ingest the documents
    await Ingest.scheduleIngestJob('website', bot)
  }

  private static async scheduleIngestJob(type: 'document' | 'website', bot: Bot) {
    const jobKey = type === 'document' ? new IngestDocument().key : new IngestWebsite().key

    await Bull.add(
      jobKey,
      {
        botId: bot.id,
      },
      {
        jobId: bot.id,
        removeOnFail: false,
        attempts: 3,
      }
    )
  }
}
