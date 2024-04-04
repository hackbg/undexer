import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ResignSteward = sequelizer.define("resignSteward", {
    address: {
        type: DataTypes.STRING,
    },
});

export default ResignSteward;
