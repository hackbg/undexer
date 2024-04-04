import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ChangeValidatorComission = sequelizer.define("changeValidatorComission", {
    validator: {
        type: DataTypes.STRING,
    },
    newRate: {
        type: DataTypes.STRING,
    },
});

export default ChangeValidatorComission;
