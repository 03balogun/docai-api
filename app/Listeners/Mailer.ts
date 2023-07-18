import Env from '@ioc:Adonis/Core/Env'
import sgMail from '@sendgrid/mail'
import { EventsList } from '@ioc:Adonis/Core/Event'
sgMail.setApiKey(Env.get('SENDGRID_API_KEY'))
const appName = Env.get('APP_NAME')

export default class Mailer {
  private static async sendMail({ to, subject, templateId, dynamicTemplateData }) {
    try {
      await sgMail.send({
        to,
        subject,
        dynamicTemplateData,
        templateId,
        from: {
          name: appName,
          email: 'hello@havenai.xyz',
        },
      })
    } catch (e) {
      // TODO: Log error
      console.error(e)
    }
  }
  public async onForgotPassword({ user, code }: EventsList['mail:forgot-password']) {
    await Mailer.sendMail({
      to: user.email,
      subject: 'Reset your password',
      // TODO: Change templateId
      templateId: 'd-c69e3d109d5a460ebc6dabb25cab660d',
      dynamicTemplateData: {
        firstName: user.name,
        code,
      },
    })
  }

  public async onForgotPasswordReset({ user }: EventsList['mail:forgot-password-reset']) {
    await Mailer.sendMail({
      to: user.email,
      subject: 'Password reset successful',
      // TODO: Change templateId
      templateId: 'd-c69e3d109d5a460ebc6dabb25cab660d',
      dynamicTemplateData: {
        firstName: user.name,
      },
    })
  }

  public async onWelcome({ user, code }: EventsList['mail:welcome']) {
    //
    console.error('[onWelcome]', { user, code })
    await Mailer.sendMail({
      to: user.email,
      subject: 'Welcome to HavenAI',
      // TODO: Change templateId
      templateId: 'd-c69e3d109d5a460ebc6dabb25cab660d',
      dynamicTemplateData: {
        firstName: user.name,
        code,
      },
    })
  }
}
