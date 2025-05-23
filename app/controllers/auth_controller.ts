import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
    async login({ request, auth, response }: HttpContext) {
        const { email, password } = request.only(['email', 'password'])

        // console.log(email, password)

        const user = await User.findBy('email', email)

        if (!user) {
        return response.unauthorized({ message: 'Invalid credentials' })
        }

        // Check the password using Adonis hash
        const isPasswordValid = await hash.verify(user.password, password)

        if (!isPasswordValid) {
        return response.unauthorized({ message: 'Invalid credentials' })
        }

        
        const token = await User.accessTokens.create(user)

        return {
            type: 'bearer',
            token: token.value!.release(), // token string

        }
    }
}
