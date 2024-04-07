import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Cipher = sequelizer.define('sct_cipher', {
    cipherText: {
        type: DataTypes.TEXT,
        
    },
});

export default Cipher;