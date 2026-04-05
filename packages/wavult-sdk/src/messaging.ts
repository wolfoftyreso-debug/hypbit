import { WavultClient } from './client'

export class MessagingModule {
  constructor(private client: WavultClient) {}

  async sendSms(to: string, message: string): Promise<{ id: string }> {
    return this.client.fetch('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify({ to, message })
    })
  }

  async sendEmail(to: string, subject: string, body: string): Promise<{ id: string }> {
    return this.client.fetch('/api/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body })
    })
  }
}
