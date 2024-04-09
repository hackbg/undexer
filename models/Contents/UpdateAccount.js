import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const UpdateAccount = sequelizer.define("cnt_update_account", {
    address: {
        type: DataTypes.TEXT,
    },
    vpCodeHash: {
        type: DataTypes.TEXT,
    },
    publicKeys: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
    threshold: {
        type: DataTypes.TEXT,
    },
});

export default UpdateAccount;