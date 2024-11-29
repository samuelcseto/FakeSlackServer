// FakeSlackServer/app/services/channel_cleaner.ts
import cron from 'cron'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

// 10 seconds for testing
/* export class ChannelCleaner {
  public static startCleaning() {
    // Run every second
    new cron.CronJob('* * * * * *', async () => {
      const maxInactiveTime = DateTime.now().minus({ seconds: 10 })

      const inactiveChannels = await Channel.query()
        .where('last_activity', '<=', maxInactiveTime.toSQL())
        .where('name', 'not in', ['general', 'global'])

      for (const channel of inactiveChannels) {
        await channel.delete()
        console.log(`Deleted inactive channel: ${channel.name}`)
      }
    }).start()
  }
} */

// 30 days
export class ChannelCleaner {
  public static startCleaning() {
    // Run at midnight every day
    new cron.CronJob('0 0 * * * ', async () => {
      const maxInactiveTime = DateTime.now().minus({ days: 30 })

      const inactiveChannels = await Channel.query()
        .where('last_activity', '<=', maxInactiveTime.toSQL())
        .where('name', 'not in', ['general', 'global'])

      for (const channel of inactiveChannels) {
        await channel.delete()
        console.log(`Deleted inactive channel: ${channel.name}`)
      }
    }).start()
  }
}
