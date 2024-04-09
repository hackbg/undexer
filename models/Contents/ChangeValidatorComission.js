import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ChangeValidatorComission = sequelizer.define("content_change_validator_comission", {
    validator: {
        type: DataTypes.TEXT,
    },
    newRate: {
        type: DataTypes.TEXT,
    },
});

export default ChangeValidatorComission;
