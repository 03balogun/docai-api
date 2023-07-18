import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { v4 as uuidv4 } from 'uuid'

import { deleteFiles, getAvatar, loadHTML, successResponse } from '../../../utils/helper'
import CreateBotValidator from 'App/Validators/CreateBotValidator'
import Bull from '@ioc:Rocketseat/Bull'
import IngestDocument from 'App/Jobs/IngestDocument'
import botIdValidator from 'App/Validators/botIdValidator'
import baseFilterValidator from 'App/Validators/baseFilterValidator'
import Application from '@ioc:Adonis/Core/Application'
import Event from '@ioc:Adonis/Core/Event'
import WebsiteInfoValidator from 'App/Validators/WebsiteInfoValidator'
import ChatMessageValidator from 'App/Validators/ChatMessageValidator'
import Bot from 'App/Models/Bot'
import langChainService from '@ioc:Services/LangChainService'
const cheerio = require('cheerio')

export default class BotsController {
  public async create({ request, auth }: HttpContextContract) {
    const { documents, urls, ...requestData } = await request.validate(CreateBotValidator)

    requestData.avatar = await getAvatar(requestData.name)

    const bot = await auth.user!.related('bots').create(requestData)

    if (requestData.dataType === 'documents' && documents?.length) {
      Event.emit('ingest:documents', { bot, documents })
    }

    if (requestData.dataType === 'website' && urls?.length) {
      Event.emit('ingest:website', { bot, urls })
    }

    return successResponse(
      'Chat bot was created successfully, data training is now in progress.',
      bot
    )
  }

  public async allBots(ctx: HttpContextContract) {
    const { page, limit } = await baseFilterValidator(ctx)

    const bots = await ctx.auth
      .user!.related('bots')
      .query()
      .preload('documents')
      .orderBy('created_at', 'desc')
      .paginate(page || 1, limit || 20)

    const results = bots.map(async (bot) => await BotsController.formatBot(bot as Bot))

    return successResponse('Bots retrieved successfully.', {
      ...bots.serialize(),
      data: await Promise.all(results),
    })
  }

  public async getBot(ctx: HttpContextContract) {
    const { botId } = await botIdValidator(ctx)
    const bot = await ctx.auth.user!.related('bots').query().where('id', botId).firstOrFail()
    await bot.load('documents')

    const result = await BotsController.formatBot(bot)

    return successResponse('Bot retrieved successfully.', result)
  }

  public async delete(ctx: HttpContextContract) {
    const { botId } = await botIdValidator(ctx)

    const bot = await ctx.auth.user!.related('bots').query().where('id', botId).firstOrFail()

    await bot.load('documents')

    // confirm that the bot is not in training
    const isTraining = bot.documents.some((document) => document.trainingStatus === 'in_progress')

    if (isTraining) {
      return ctx.response.badRequest({
        status: false,
        message: 'You cannot delete a bot that is currently in training.',
      })
    }

    await langChainService.dropDocumentIndex(botId)

    if (bot.dataType === 'documents') {
      await deleteFiles(Application.tmpPath(`documents/${bot.id}`))
    }

    await Bull.getByKey(new IngestDocument().key).bull.remove(bot.id)

    await bot.delete()

    return successResponse('Chat bot was deleted successfully.')
  }

  public async chat(ctx: HttpContextContract) {
    let { message, botId, sessionId } = await ctx.request.validate(ChatMessageValidator)

    const bot = await Bot.query().where('id', botId).firstOrFail()

    await bot.load('user')

    await BotsController.chatPreChecks(ctx, bot)

    if (!sessionId) {
      sessionId = uuidv4()
    }

    const response = await langChainService.initConversation({
      message,
      sessionId,
      name: bot.name,
      indexName: bot.id,
    })

    let sourceDocuments = response?.sourceDocuments?.map(({ pageContent, metadata }) => ({
      pageContent,
      metadata,
    }))

    return successResponse('Chat message sent successfully.', {
      text: response?.output_text,
      sourceDocuments,
      sessionId,
    })
  }

  public async botIntro(ctx: HttpContextContract) {
    const { botId } = await botIdValidator(ctx)

    const bot = await Bot.query().where('id', botId).firstOrFail()

    await bot.load('user')

    await BotsController.chatPreChecks(ctx, bot)

    const response = await langChainService.getIntro({ indexName: botId, name: bot.name })

    return successResponse('Chat message sent successfully.', response)
  }

  public async websiteInfo({ request }: HttpContextContract) {
    try {
      // calculate the time it takes to get the website info
      const { url, sourceType } = await request.validate(WebsiteInfoValidator)

      const { host, origin, protocol } = new URL(url)

      const webpageDocument = await loadHTML(url)

      const $ = await cheerio.load(webpageDocument)

      // detect the url links to a file using axios

      const title = $('title').text()
      const description = $('meta[name="description"]').attr('content')
      // get the favicon
      let favicon = $('link[rel="shortcut icon"]').attr('href')

      if (!favicon) {
        favicon = $('link[rel="icon"]').attr('href')
      }

      let websiteIcon = favicon

      if (favicon && !favicon.includes(protocol)) {
        websiteIcon = new URL(favicon, origin).toString()
      }

      let uniqueLinks: string[] = []

      if (sourceType === 'multiple') {
        const links = $('a')
          .map((_, el) => {
            const link = new URL($(el).attr('href') || '', origin).toString()

            if (link && link.includes(protocol)) {
              return link
            }

            return new URL(link, origin).toString()
          })
          .get()

        uniqueLinks = [...new Set(links)].filter((link: string) => {
          const webUrl = new URL(link)

          return webUrl.host === host && webUrl.protocol === protocol && !webUrl.hash
        }) as string[]
      }

      if (sourceType === 'single') {
        uniqueLinks = [url]
      }

      return successResponse('Website info retrieved successfully.', {
        title,
        description,
        icon: websiteIcon,
        links: uniqueLinks,
      })
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        throw new Error('Unable to get website info, please check the url and try again.')
      }

      if (error?.response?.status === 999) {
        throw new Error('This website is not supported. Please try another website. 🫣')
      }

      throw new Error(
        'Unable to get website info, please try again. If error persists, contact support.'
      )
    }
  }

  private static async chatPreChecks(ctx: HttpContextContract, bot: Bot) {
    // check if the bot is public
    if (!ctx.auth?.isAuthenticated || bot?.meta?.isPublic === false) {
      return ctx.response.notFound()
    }

    // check if the bot is public
    if (ctx.auth?.user?.id !== bot.user.id && !bot.meta.isPublic) {
      return ctx.response.forbidden({ message: 'Unauthorized access.' })
    }

    await bot.load('documents')

    // check if the bot is trained, if at least one document is trained
    const isTrained = bot.documents.some((document) => document.trainingStatus === 'completed')

    if (!isTrained) {
      return ctx.response.badRequest({ message: 'Bot is not trained yet.' })
    }
  }

  private static async formatBot(bot: Bot) {
    const completedDocs = bot.documents.filter(
      (document) => document.trainingStatus === 'completed'
    )
    const failedDocs = bot.documents.filter((document) => document.trainingStatus === 'failed')

    return {
      ...bot.toJSON(),
      training_failed: failedDocs.length === bot.documents.length,
      training_complete: completedDocs.length === bot.documents.length,
      total_docs: bot.documents.length,
      trained_docs: completedDocs.length,
    }
  }
}
