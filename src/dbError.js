import db from './db.js'
import { IntegerPrimaryKey } from './dbKeys.js'
import { JSONField, NullableJSONField } from './dbJson.js'
import { DataTypes } from "sequelize"
const { DATE, TEXT } = DataTypes

/** Errors logged to the database. */
export const ErrorLog = db.define('error_log', {
  id:        IntegerPrimaryKey(true),
  timestamp: { type: DATE },
  message:   { type: TEXT },
  stack:     JSONField('stack'),
  info:      NullableJSONField('info'),
})

/** Log an error to the database. */
export function logErrorToDB (error, info) {
  console.error('Logging error to database:',
    '\n  Message:', error?.message,
    '\n  Info:',    info,
    '\n  Stack:',   error?.stack)
  return ErrorLog.create({
    timestamp: new Date(),
    message:   error?.message,
    stack:     error?.stack,
    info
  })
}

/** Log an error to the database if a code block fails. */
export async function withErrorLog (callback, info) {
  try {
    return await Promise.resolve(callback())
  } catch (error) {
    await logErrorToDB(error, info)
    throw error
  }
}
