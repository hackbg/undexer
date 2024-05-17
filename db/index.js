// db/index.js
import { Sequelize } from "sequelize";
import { Console } from "@hackbg/logs";
import { DATABASE_URL } from "../constants.js";
const console = new Console("DB");

export default new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
});
