import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ReactivateValidator = sequelizer.define("cntreactivate_validator", {
    address: {
        type: DataTypes.TEXT,
    },
});

export default ReactivateValidator;
