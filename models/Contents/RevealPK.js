import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const RevealPK = sequelizer.define("revealPK", {
    pk: {
        type: DataTypes.STRING,
    },
});

export default RevealPK;
