import sequelize from "../../db/index.js";
import { DataTypes } from "sequelize";

const ExtraData = sequelize.define('section_extra_data', {
    salt: {
        type: DataTypes.TEXT,
    },
    code: {
        type: DataTypes.TEXT,
    },
    tag: {
        type: DataTypes.TEXT,
    },
});

export default ExtraData;
