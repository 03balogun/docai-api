import { createClient } from 'redis'

import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { JSONLoader } from 'langchain/document_loaders/fs/json'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { CSVLoader } from 'langchain/document_loaders/fs/csv'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { DocxLoader } from 'langchain/document_loaders/fs/docx'
import { EPubLoader } from 'langchain/document_loaders/fs/epub'
import { RedisVectorStore } from 'langchain/vectorstores/redis'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { Document } from 'langchain/document'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { BufferMemory } from 'langchain/memory'
import { RedisChatMessageHistory } from 'langchain/stores/message/redis'
import { ConversationalRetrievalQAChain, RetrievalQAChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import { OpenAI } from 'langchain/llms/openai'

import {
  BOT_INTRO_TEMPLATE,
  CONDENSE_PROMPT_TEMPLATE,
  QA_PROMPT_TEMPLATE,
} from 'App/Services/LangChainService/contstants'

type Interpolate = (template: string, data: { [key: string]: string }) => string

export class LangChainService {
  private readonly model: OpenAI
  private readonly embeddings: OpenAIEmbeddings
  private redisClient: ReturnType<typeof createClient>
  private redisConfig: {
    host: string
  }

  /**
   * @description interpolate curly braces inside a string with data
   * @private
   */
  private readonly interpolate: Interpolate

  constructor(redisHost: string, interpolate: Interpolate) {
    this.interpolate = interpolate

    this.model = new OpenAI({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
      maxConcurrency: 10,
    })

    this.embeddings = new OpenAIEmbeddings()

    this.redisConfig = {
      host: redisHost,
    }

    this.connectRedis()
  }

  /**
   * @description Load documents from a directory and store them to the vector database
   * @param indexName
   * @param documentPath
   */
  public async storeFileDocuments(indexName: string, documentPath: string) {
    const loadedDocs = await LangChainService.documentLoader(documentPath)
    const docs = await LangChainService.splitDocuments(loadedDocs)

    await this.saveToVectorStore(indexName, docs)
  }

  /**
   * @description split documents into smaller chunks then save it to the vector database
   * @param indexName
   * @param documents
   */
  public async storeDocuments(indexName: string, documents: Document[]) {
    const docs = await LangChainService.splitDocuments(documents)

    await this.saveToVectorStore(indexName, docs)
  }

  /**
   * @description Add a new document to the documents array
   * @param text
   * @param meta
   */
  public addDocument(text: string, meta: Record<string, string>) {
    return new Document({
      pageContent: text,
      metadata: meta,
    })
  }

  /**
   * @description Get an instance of the vector database
   * @param indexName
   * @private
   */
  private async connectVectorStore(indexName: string) {
    return new RedisVectorStore(this.embeddings, {
      redisClient: this.redisClient,
      indexName: indexName,
    })
  }

  /**
   * @description Delete an index of the vector database
   * @param indexName
   */
  public async dropDocumentIndex(indexName: string) {
    return (await this.connectVectorStore(indexName)).dropIndex()
  }

  /**
   * @description Respond to a message from a user base on their conversation history and the contents that match the context
   * @param payload
   */
  public async initConversation(payload: {
    message: string
    name: string
    sessionId: string
    indexName: string
  }) {
    const { message, name, sessionId, indexName } = payload

    const retriever = await this.vectorStoreRetriever(indexName)

    const chain = ConversationalRetrievalQAChain.fromLLM(this.model, retriever, {
      returnSourceDocuments: true,
      memory: await this.conversationMemory(sessionId),
      outputKey: 'text',
      qaChainOptions: {
        type: 'refine',
        questionPrompt: PromptTemplate.fromTemplate(CONDENSE_PROMPT_TEMPLATE),
        refinePrompt: PromptTemplate.fromTemplate(
          this.interpolate(QA_PROMPT_TEMPLATE, { botName: name })
        ),
        verbose: true,
      },
    })

    return await chain.call({
      question: message,
    })
  }

  /**
   * @description Get the bots intro message which is based on the indexed documents
   * @param indexName
   * @param name
   */
  public async getIntro({ indexName, name }: { indexName: string; name: string }) {
    const retriever = await this.vectorStoreRetriever(indexName)

    const chain = RetrievalQAChain.fromLLM(this.model, retriever)

    return chain.call({
      query: this.interpolate(BOT_INTRO_TEMPLATE, { botName: name }),
      verbose: true,
    })
  }

  /**
   * @description Connect to the redis database
   * @private
   */
  private async connectRedis() {
    const client = createClient({
      url: this.redisConfig.host,
      isolationPoolOptions: {
        idleTimeoutMillis: 30000,
      },
    })
    try {
      await client.connect()
    } catch (error) {
      //
    }
    this.redisClient = client
  }

  /**
   * @description Split documents into smaller chunks
   * @param documents
   * @private
   */
  private static async splitDocuments(documents: Document[]) {
    const textSplitter = new RecursiveCharacterTextSplitter()

    return await textSplitter.splitDocuments(documents)
  }

  private async vectorStoreRetriever(indexName: string) {
    return (await this.connectVectorStore(indexName)).asRetriever()
  }

  private async conversationMemory(sessionId: string) {
    return new BufferMemory({
      chatHistory: new RedisChatMessageHistory({
        sessionId: sessionId,
        sessionTTL: 300,
        client: this.redisClient,
      }),
      memoryKey: 'chat_history',
      inputKey: 'question',
      outputKey: 'text',
      returnMessages: true,
    })
  }

  private async saveToVectorStore(indexName: string, documents: Document[]) {
    return await RedisVectorStore.fromDocuments(documents, this.embeddings, {
      redisClient: this.redisClient,
      indexName,
      keyPrefix: 'key_',
    })
  }

  public static async documentLoader(folderPath: string) {
    return new DirectoryLoader(folderPath, {
      '.json': (path) => new JSONLoader(path),
      '.txt': (path) => new TextLoader(path),
      '.csv': (path) => new CSVLoader(path),
      '.pdf': (path) => new PDFLoader(path, { splitPages: true }),
      '.docx': (path) => new DocxLoader(path),
      '.epub': (path) => new EPubLoader(path),
    }).load()
  }
}
