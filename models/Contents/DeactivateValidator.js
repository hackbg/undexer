import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const DeactivateValidator = sequelizer.define('deactivateValidator', {
    address: {
        type: DataTypes.STRING,
        
    },
});

export default DeactivateValidator;