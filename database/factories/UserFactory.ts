import User from 'App/Models/User'
import Factory from '@ioc:Adonis/Lucid/Factory'

export const UserFactory = Factory.define(User, ({ faker }) => {
  const name = faker.person.fullName()

  return {
    name,
    username: faker.internet.displayName({ firstName: name }),
    email: faker.internet.email(),
    password: faker.internet.password(),
  }
}).build()
