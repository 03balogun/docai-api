import { test } from '@japa/runner'

test.group('Create bot', () => {
  test('Error when no payload is passed', async ({ client }) => {
    const response = await client.post('api/v1/bots')
    response.assertStatus(500)
  })

  test('Error when type is files and documents is not uploaded', async ({ client }) => {
    const response = await client.post('api/v1/bots').fields({
      name: 'Avatar',
      description: 'An Chat bot trained on avatar the fandom data.',
      avatar: 'https://ui-avatars.com/api/?name=Avatar&format=svg&size=128',
      dataType: 'documents',
      documents: [],
    })

    response.assertStatus(422)
    response.assertBody({
      errors: [
        {
          rule: 'requiredWhen',
          field: 'documents',
          message: 'requiredWhen validation failed',
          args: { operator: '=', otherField: 'documentType', values: 'files' },
        },
      ],
    })
  })

  test('Error when type is urls and web urls are not passed', async ({ client }) => {
    const response = await client.post('api/v1/bots').fields({
      name: 'Avatar',
      description: 'An Chat bot trained on avatar the fandom data.',
      avatar: 'https://ui-avatars.com/api/?name=Avatar&format=svg&size=128',
      documentType: 'urls',
    })

    console.log('[response.body() 👀]', JSON.stringify(response.body()))

    response.assertStatus(422)
    response.assertBody({
      errors: [
        {
          rule: 'requiredWhen',
          field: 'documents',
          message: 'requiredWhen validation failed',
          args: { operator: '=', otherField: 'documentType', values: 'files' },
        },
      ],
    })
  })
})
