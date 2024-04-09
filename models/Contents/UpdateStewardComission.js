import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const UpdateStewardCommission = sequelizer.define("cntupdate_steward_commission", {
    steward: {
        type: DataTypes.TEXT,
    },
    commission: {
        type: DataTypes.JSON,
    },
});

export default UpdateStewardCommission;