import { configApp } from '@adonisjs/eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
    ...configApp,
    ...eslintConfigPrettier
]
