// db/index.js
import "dotenv/config";
import { Sequelize } from "sequelize";
import { Console } from "@hackbg/logs";
import { DEFAULT_DATABASE_URL } from "../constants.js";
const console = new Console("DB");
export let { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.warn(`DATABASE_URL unset. Defaulting to ${DEFAULT_DATABASE_URL}`);
  DATABASE_URL = DEFAULT_DATABASE_URL;
}
export default new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
});
