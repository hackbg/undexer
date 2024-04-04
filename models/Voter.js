import { DataTypes } from "sequelize";
import sequelizer from "../db/index.js";

const Voter = sequelizer.define("voter", {
    vote: {
        type: DataTypes.ENUM("yay", "nay", "abstain"),
    },
    power: {
        type: DataTypes.STRING,
    },
    voter: {
        type: DataTypes.STRING,
    },
    id: {
        type: DataTypes.STRING,
    },
});

export default Voter;