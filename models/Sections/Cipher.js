import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Cipher = sequelizer.define('cipher', {
    cipherText: {
        type: DataTypes.TEXT,
        
    },
});

export default Cipher;