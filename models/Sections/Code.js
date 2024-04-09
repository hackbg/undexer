import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Code = sequelizer.define('section_code', {
    salt: {
        type: DataTypes.TEXT,
    },
    code: {
        type: DataTypes.TEXT,
    },
    tag: {
        type: DataTypes.TEXT,

    },
})

export default Code;
