// db/index.js
import { Sequelize } from "sequelize";

import "dotenv/config";
const { DATABASE_URL } = process.env;

class SequelizeSingleton {
    constructor() {
        if (!DATABASE_URL) {
            throw new Error("DATABASE_URL is not set");
        }

        if (!SequelizeSingleton.instance) {
            SequelizeSingleton.instance = new Sequelize(DATABASE_URL, {
                dialect: "postgres",
                logging: () => console.log,
            });
        }
    }

    getInstance() {
        return SequelizeSingleton.instance;
    }
}
const sequelizer = new SequelizeSingleton().getInstance();
export default sequelizer;
