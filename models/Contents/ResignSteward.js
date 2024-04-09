import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ResignSteward = sequelizer.define("content_resign_steward", {
    address: {
        type: DataTypes.TEXT,
    },
});

export default ResignSteward;
