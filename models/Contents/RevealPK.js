import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const RevealPK = sequelizer.define("cntreveal_PK", {
    pk: {
        type: DataTypes.STRING,
    },
});

export default RevealPK;
