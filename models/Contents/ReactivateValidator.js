import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ReactivateValidator = sequelizer.define("cnt_reactivate_validator", {
    address: {
        type: DataTypes.TEXT,
    },
});

export default ReactivateValidator;
