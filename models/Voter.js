import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const Voter = sequelize.define("voter", {
    vote: {
        type: DataTypes.ENUM("yay", "nay", "abstain"),
    },
    power: {
        type: DataTypes.TEXT,
    },
    voter: {
        type: DataTypes.TEXT,
    },
    proposalId: {
        type: DataTypes.INTEGER,
    },
});

export default Voter;
