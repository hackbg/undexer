import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const RevealPK = sequelizer.define("content_reveal_pk", {
    pk: {
        type: DataTypes.JSON
    },
});

export default RevealPK;
