import { test } from "@japa/runner";
import User from "#models/user/user";
import hash from "@adonisjs/core/services/hash";

test.group("Auth controller - login", (group) => {
  group.each.setup(async () => {
    // Clean up users after each test
    await User.query().delete();
  });

  test("should login successfully with valid credentials", async ({
    client,
    assert,
  }) => {
    // Arrange
    const password = "password123";
    const hashedPassword = await hash.make(password);

    const user = await User.create({
      email: "test@example.com",
      password: password,
      name: "John Doe",
      address: "123 Main St, Springfield",
    });

    // Act
    const response = await client.post("/api/v1/auth").json({
      email: "test@example.com",
      password: password,
    });

    response.assertStatus(200);
    response.assertBodyContains({
      type: "bearer",
    });
    assert.exists(response.body().token);
    assert.isString(response.body().token);
  });

  test("should return 401 when user does not exist", async ({ client }) => {
    // Act
    const response = await client.post("/api/v1/auth").json({
      email: "nonexistent@example.com",
      password: "password123",
    });

    // Assert
    response.assertStatus(401);
    response.assertBodyContains({
      message: "User not found",
    });
  });

  test("should return 401 when password is incorrect", async ({ client }) => {
    await User.create({
      email: "test@example.com",
      password: "realpassword",
      name: "John Doe",
      address: "123 Main St, Springfield",
    });

    // Act
    const response = await client.post("/api/v1/auth").json({
      email: "test@example.com",
      password: "wrongpassword",
    });

    // Assert
    response.assertStatus(401);
    response.assertBodyContains({
      message: "Invalid credentials",
    });
  });

  test("should return 422 when email is missing", async ({ client }) => {
    // Act
    const response = await client.post("/api/v1/auth").json({
      password: "password123",
    });

    // Assert
    response.assertStatus(422);
  });

  test("should return 422 when password is missing", async ({ client }) => {
    // Act
    const response = await client.post("/api/v1/auth").json({
      email: "test@example.com",
    });

    // Assert
    response.assertStatus(422);
  });

  test("should create a valid access token and check authentication", async ({
    client,
    assert,
  }) => {
    // Arrange
    const password = "password123";

    const user = await User.create({
      email: "test@example.com",
      password: password,
      name: "John Doe",
      address: "123 Main St, Springfield",
    });

    // Act
    const response = await client.post("/api/v1/auth").json({
      email: "test@example.com",
      password: password,
    });

    // Assert
    const token = response.body().token;

    const authenticatedResponse = await client
      .get("/api/v1/cart")
      .bearerToken(token);

    assert.exists(authenticatedResponse);
    assert.notEqual(authenticatedResponse.status(), 401);
  });
});
