import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Application from '@adonisjs/core/services/app'

export default class IndexSeeder extends BaseSeeder {
  private async runSeeder(Seeder: { default: typeof BaseSeeder }) {
    /**
     * Do not run when not in an environment specified in Seeder
     */
    const environments = Seeder.default.environment || ['development', 'testing', 'production']
    if (
      (environments.includes('development') && Application.inDev) ||
      (environments.includes('testing') && Application.inTest) ||
      (environments.includes('production') && Application.inProduction)
    ) {
      await new Seeder.default(this.client).run()
    }
  }

  public async run() {
    await this.runSeeder(await import('#database/seeders/user_seeder'))
    await this.runSeeder(await import('#database/seeders/channel_seeder'))
    await this.runSeeder(await import('#database/seeders/message_seeder'))
  }
}
