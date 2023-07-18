import { test } from '@japa/runner'
import sinon from 'sinon'

import IngestWebsite from 'App/Jobs/IngestWebsite'
import axios from 'axios'

test.group('Fetch pages', () => {
  test('fetch page', async (context) => {
    const axiosGetStub = sinon.stub(axios, 'get')

    const ingestWebsite = new IngestWebsite()

    const urls = [
      'https://trackfundx.com/',
      'https://trackfundx.com/about',
      'https://trackfundx.com/blog',
      'https://trackfundx.com/contact',
      'https://trackfundx.com/blog/new-features-on-trackfundx-that-make-personal-finance-management-easy',
    ]

    axiosGetStub.resolves({ data: urls })

    const documents = await ingestWebsite.fetchPages(urls)
    context.assert.lengthOf(documents, urls.length)

    for (const url of urls) {
      sinon.assert.calledWith(axiosGetStub, url)
    }
  })
})
