import { JobContract } from '@ioc:Rocketseat/Bull'
import { loadHTML } from '../../utils/helper'
import Bot from 'App/Models/Bot'
import DocumentDBModel from 'App/Models/Document'
import { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import langChainService from '@ioc:Services/LangChainService'
const cheerio = require('cheerio')

export default class IngestWebsite implements JobContract {
  public key = 'IngestWebsite'
  public concurrency = 5

  public workerOptions: {
    concurrency: 5
  }

  public async handle(job) {
    const { data } = job
    const bot = await Bot.findOrFail(data.botId)
    await bot.load('documents', (query) => {
      query.where('type', 'website')
    })

    const urls = bot.documents.map((doc) => doc.name)

    const webpageDocuments = await this.fetchPages(urls)

    const vectoredDocuments: ReturnType<typeof langChainService.addDocument>[] = []

    const errorUpdates: ModelQueryBuilderContract<typeof DocumentDBModel>[] = []

    // store the html in the redis vector store and update the document status
    for (let i = 0; i < webpageDocuments.length; i++) {
      const webpageDocument = webpageDocuments[i]
      if (!webpageDocument.error && webpageDocument.html) {
        const $ = cheerio.load(webpageDocument.html)
        const title = $('title').text()

        $('script, style, iframe, img').remove()

        let text = $('body').text()

        text = text.replace(/\s+/g, ' ').trim()

        vectoredDocuments.push(
          langChainService.addDocument(text, { title, url: webpageDocument.url })
        )
      }

      if (webpageDocument.error) {
        errorUpdates.push(
          bot
            .related('documents')
            .query()
            .where('name', webpageDocument.url)
            .update({
              trainingStatus: 'failed',
              meta: {
                error: webpageDocument.error,
              },
            })
        )
      }
    }

    // update the documents that failed to be fetched with the error
    if (errorUpdates.length > 0) {
      await Promise.all(errorUpdates)
    }

    if (vectoredDocuments.length > 0) {
      //
      await langChainService.storeDocuments(bot.id, vectoredDocuments)

      await bot
        .related('documents')
        .query()
        .whereIn(
          'name',
          vectoredDocuments.map((doc) => doc.metadata.url)
        )
        .update({
          trainingStatus: 'completed',
        })
    }
  }

  public async fetchPages(urls: string[]) {
    const delayBetweenRequests = 500 // 500 milli delay between each request

    const aggregatedData: { url: string; html: string; error?: Record<string, any> }[] = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      try {
        const response = await loadHTML(url)

        aggregatedData.push({ url, html: response })

        if (i < urls.length - 1) {
          // Wait for the specified delay before making the next request
          await this.delay(delayBetweenRequests)
        }
      } catch (error) {
        aggregatedData.push({
          url,
          html: '',
          error: { message: error.message, response: error?.response?.data },
        })

        console.error(`Error fetching page: ${url}`)
        console.error(error)
        // TODO: log the error to sentry
      }
    }

    return aggregatedData
  }

  private async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
