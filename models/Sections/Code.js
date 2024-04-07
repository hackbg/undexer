import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Code = sequelizer.define('sct_code', {
    salt: {
        type: DataTypes.TEXT,
    },
    code: {
        type: DataTypes.TEXT,
    },
    tag: {
        type: DataTypes.STRING,

    },
})

export default Code;