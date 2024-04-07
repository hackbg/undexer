import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ChangeValidatorComission = sequelizer.define("cntchange_validator_comission", {
    validator: {
        type: DataTypes.STRING,
    },
    newRate: {
        type: DataTypes.STRING,
    },
});

export default ChangeValidatorComission;
