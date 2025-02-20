import { DataTypes } from "sequelize"
const { INTEGER, TEXT } = DataTypes

export const IntegerPrimaryKey = (autoIncrement = false) => ({
  type:       INTEGER,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
  autoIncrement
})

export const StringPrimaryKey = () => ({
  type:       TEXT,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
})

export const CompoundPrimaryKey = (fields) => Object.fromEntries(
  Object.entries(fields).map(([key, value])=>[key, {
    ...value,
    unique:     false,
    primaryKey: true,
    allowNull:  false,
  }])
)
