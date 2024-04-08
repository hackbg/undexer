import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ResignSteward = sequelizer.define("cntresign_steward", {
    address: {
        type: DataTypes.TEXT,
    },
});

export default ResignSteward;
