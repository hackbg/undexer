import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Cipher = sequelizer.define('section_cipher', {
    cipherText: {
        type: DataTypes.TEXT,
        
    },
});

export default Cipher;
