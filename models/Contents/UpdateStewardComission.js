import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const UpdateStewardCommission = sequelizer.define("updateStewardCommission", {
    steward: {
        type: DataTypes.STRING,
    },
    commission: {
        type: DataTypes.JSON,
    },
});

export default UpdateStewardCommission;
