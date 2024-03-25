// db/index.js
const { Sequelize } = require('sequelize');

import "dotenv/config";

class SequelizeSingleton {
    constructor() {
        if(!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not set");
        }

        if (!SequelizeSingleton.instance) {
            SequelizeSingleton.instance = new Sequelize(
                process.env.DATABASE_URL
            );
        }
    }

    getInstance() {
        return SequelizeSingleton.instance;
    }

    async test(){
        await SeuqalizeSingleton.instance.authenticate();
        console.log("test");
    }
}
const sequencer = new SequelizeSingleton().getInstance()
export default sequencer;
