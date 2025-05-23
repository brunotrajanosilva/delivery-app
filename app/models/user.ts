import { BaseModel, column, beforeSave } from '@adonisjs/lucid/orm'
// import { Hash } from '@adonisjs/core/hash'
import hash from '@adonisjs/core/services/hash'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'


export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare full_name: string

  @column()
  declare address: string

  @column()
  declare email: string

  @column({ serializeAs: null }) // hides from API responses
  declare password: string

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: Date

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

}
