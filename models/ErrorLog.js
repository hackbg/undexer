import { DataTypes } from "sequelize"
import sequelize from "../db/index.js"

const ErrorLog = sequelize.define('error_log', {
  id:        { type: DataTypes.INTEGER, allowNull: false, unique: true, primaryKey: true },
  timestamp: { type: DataTypes.DATE },
  message:   { type: DataTypes.TEXT },
  stack:     { type: DataTypes.JSON },
  info:      { type: DataTypes.JSON, allowNull: true },
})

export default ErrorLog

export function logErrorToDB (error, info) {
  return ErrorLog.create({
    timestamp: new Date(),
    message:   error.message,
    stack:     error.stack,
    info
  })
}

export function withLogErrorToDB (callback, info) {
  try {
    await Promise.resolve(callback())
  } catch (e) {
    logErrorToDB(error, info)
  }
}
