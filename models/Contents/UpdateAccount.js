import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const UpdateAccount = sequelizer.define("updateAccount", {
    address: {
        type: DataTypes.STRING,
    },
    vpCodeHash: {
        type: DataTypes.STRING,
    },
    publicKeys: {
        type: DataTypes.ARRAY(DataTypes.STRING),
    },
    threshold: {
        type: DataTypes.STRING,
    },
});

export default UpdateAccount;