import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ReactivateValidator = sequelizer.define("reactivateValidator", {
    address: {
        type: DataTypes.STRING,
    },
});

export default ReactivateValidator;
