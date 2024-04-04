import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Signature = sequelizer.define("signature", {
    targets: {
        type: DataTypes.ARRAY(DataTypes.STRING),
    },
    signer: {
        type: DataTypes.TEXT,
        get() {
            try {
                return JSON.parse(this.getDataValue("signer"));
            } catch (e) {
                return null;
            }
        },
        set(value) {
            this.setDataValue("signer", JSON.stringify(value));
        },
    },
    signatures: {
        type: DataTypes.JSON,
    },
});

export default Signature;
