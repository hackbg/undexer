import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const DeactivateValidator = sequelizer.define('content_deactivate_validator', {
    address: {
        type: DataTypes.TEXT,
    },
});

export default DeactivateValidator;
