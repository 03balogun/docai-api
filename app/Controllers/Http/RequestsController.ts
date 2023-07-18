import { createClient } from 'redis'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { RedisVectorStore } from 'langchain/vectorstores/redis'
import Env from '@ioc:Adonis/Core/Env'
import { schema } from '@ioc:Adonis/Core/Validator'
import { string } from '@ioc:Adonis/Core/Helpers'
import { successResponse } from '../../../utils/helper'

const client = createClient({
  url: Env.get('REDIS_URL'),
})

export default class RequestsController {
  private static async redisClient() {
    try {
      return await client.connect()
    } catch (error) {
      console.info(error.message)
    }
  }

  public async conversation(_: HttpContextContract) {
    // await RequestsController.redisClient()
    //
    // const { message, document } = request.body()
    //
    // const question = string.condenseWhitespace(message)
    //
    // const llmUtil = new LlmUtils()
    //
    // const vectorStore = new RedisVectorStore(new OpenAIEmbeddings(), {
    //   redisClient: client,
    //   indexName: document,
    // })
    //
    // const chain = llmUtil.makeChain(vectorStore)
    //
    // const response = await chain.call({ question, chat_history: [] })
    //
    // const sourceDocuments = response.sourceDocuments.map(({ pageContent, metadata }) => ({
    //   pageContent,
    //   metadata: {
    //     location: metadata.loc,
    //   },
    // }))
    //
    // await client.disconnect()
    // return successResponse('RESPONSE_MESSAGES.en.MESSAGE_SENT', {
    //   text: response.text,
    //   sourceDocuments,
    // })
  }

  public async ingest({ request }: HttpContextContract) {
    const fileScheme = schema.create({
      uploadedFile: schema.file({
        size: '2mb',
        extnames: ['pdf'],
      }),
    })

    const payload = await request.validate({ schema: fileScheme })

    const filePath = payload.uploadedFile.tmpPath!

    const fileName = string.snakeCase(payload.uploadedFile.clientName)

    return this.initIngest(filePath, fileName)
  }

  public async initIngest(filePath: string, indexName: string) {
    try {
      await RequestsController.redisClient()

      const isExistingFile = await RequestsController.checkIndexExists(indexName)

      if (isExistingFile) {
        await client.disconnect()
        return successResponse('RESPONSE_MESSAGES.en.FILE_ALREADY_INDEXED')
      }

      const fileLoader = new PDFLoader(filePath)

      const rawDocs = await fileLoader.load()

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      })

      const docs = await textSplitter.splitDocuments(rawDocs)

      await RedisVectorStore.fromDocuments(docs, new OpenAIEmbeddings(), {
        redisClient: client,
        indexName: indexName,
        keyPrefix: `${indexName}_index_`,
      })

      await client.disconnect()

      return successResponse('RESPONSE_MESSAGES.en.FILE_INDEXED_SUCCESSFULLY', {
        document: indexName,
      })
    } catch (error) {
      await client.disconnect()
      console.error('[error]', error)
      throw error
    }
  }

  private static async checkIndexExists(indexName: string) {
    try {
      return !!(await client.ft.info(indexName))
    } catch (e) {
      return false
    }
  }
}
