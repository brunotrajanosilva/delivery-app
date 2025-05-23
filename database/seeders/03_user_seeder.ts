import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class UserSeeder extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        full_name: 'Alice Johnson',
        address: '123 Main St, Springfield',
        password: 'password123',
        email: 'alice.johnson@example.com',
      },
      {
        full_name: 'Bob Smith',
        address: '456 Elm St, Shelbyville',
        password: 'securepass456',
        email: 'bob.smith@example.com',
      },
      {
        full_name: 'Charlie Brown',
        address: '789 Oak Ave, Capital City',
        password: 'supersecret789',
        email: 'charlie.brown@example.com',
      },
    ])
  }
}