import type { HttpContext } from "@adonisjs/core/http";
import User from "#models/user/user";
import hash from "@adonisjs/core/services/hash";
import { loginValidator } from "#validators/auth";

export default class AuthController {
  async login({ request, response }: HttpContext) {
    await request.validateUsing(loginValidator);

    const { email, password } = request.only(["email", "password"]);
    const user = await User.findBy("email", email);

    if (!user) {
      return response.unauthorized({ message: "User not found" });
    }

    const isPasswordValid = await hash.verify(user.password, password);

    if (!isPasswordValid) {
      return response.unauthorized({ message: "Invalid credentials" });
    }

    const token = await User.accessTokens.create(user);

    return {
      type: "bearer",
      token: token.value!.release(),
    };
  }
}
