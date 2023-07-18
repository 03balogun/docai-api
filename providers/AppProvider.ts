import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'
import { interpolate } from '@ioc:Adonis/Core/Helpers'
import { LangChainService } from 'App/Services/LangChainService'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
    this.app.container.singleton(
      'Services/LangChainService',
      () => new LangChainService(Env.get('REDIS_URL'), interpolate)
    )
  }

  public async boot() {
    // IoC container is ready
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
