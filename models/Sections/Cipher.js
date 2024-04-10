import sequelize from "../../db/index.js";
import { DataTypes } from "sequelize";

const Cipher = sequelize.define('section_cipher', {
    cipherText: {
        type: DataTypes.TEXT,   
    },
});

export default Cipher;
