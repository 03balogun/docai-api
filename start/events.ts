/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import Event from '@ioc:Adonis/Core/Event'

Event.on('ingest:documents', 'Ingest.onIngestDocuments')
Event.on('ingest:website', 'Ingest.onIngestWebsite')
Event.on('mail:forgot-password', 'Mailer.onForgotPassword')
Event.on('mail:forgot-password-reset', 'Mailer.onForgotPasswordReset')
Event.on('mail:welcome', 'Mailer.onWelcome')

Event.onError((event, error, eventData) => {
  console.error(`[${event}]`, { event, error, eventData })
})
