import { Sequelize } from "sequelize"
import { Console } from "@hackbg/logs"
import { DATABASE_URL } from "../config/index.js"

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
