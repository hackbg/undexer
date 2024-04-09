import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ReactivateValidator = sequelizer.define("content_reactivate_validator", {
    address: {
        type: DataTypes.TEXT,
    },
});

export default ReactivateValidator;
