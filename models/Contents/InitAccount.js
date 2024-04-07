import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const InitAccount = sequelizer.define("cntinit_account", {
    publicKeys: {
        type: DataTypes.ARRAY(DataTypes.STRING),
    },
    vpCodeHash: {
        type: DataTypes.STRING,
    },
    threshold: {
        type: DataTypes.INTEGER,
    },
});

export default InitAccount;
