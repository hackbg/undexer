import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const DeactivateValidator = sequelizer.define('cntdeactivate_validator', {
    address: {
        type: DataTypes.TEXT,
        
    },
});

export default DeactivateValidator;