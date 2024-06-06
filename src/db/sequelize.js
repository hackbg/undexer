import { Sequelize, DataTypes } from "sequelize"
import { Console } from "@hackbg/logs"
import { DATABASE_URL } from "../config.js"

const console = new Console("DB");

export default new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
  supportBigNumbers: true,
})

export { DataTypes } from "sequelize"

export function serialize (object) {
  return JSON.stringify(object, (k, v)=>{
    if (typeof v === 'bigint') {
      return String(v)
    }
    return v
  })
}

export const IntegerPrimaryKey = {
  type:       DataTypes.INTEGER,
  allowNull:  false,
  unique:     true,
  primaryKey: true, 
}

export const StringPrimaryKey = {
  type:       DataTypes.TEXT,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
}

export const JSONField = name => ({
  type: DataTypes.JSON,
  allowNull: false,
  get() {
    return JSON.parse(this.getDataValue(name));
  },
  set(value) {
    return this.setDataValue(name, serialize(value));
  },
})
