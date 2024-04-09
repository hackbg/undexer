import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const RevealPK = sequelizer.define("cnt_reveal_PK", {
    pk: {
        type: DataTypes.JSON
        
    },
});

export default RevealPK;
