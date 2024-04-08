import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const InitAccount = sequelizer.define("cntinit_account", {
    publicKeys: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
    vpCodeHash: {
        type: DataTypes.TEXT,
    },
    threshold: {
        type: DataTypes.INTEGER,
    },
});

export default InitAccount;
