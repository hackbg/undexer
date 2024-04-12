import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const Proposal = sequelize.define('proposal', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    propoalType: {
        type: DataTypes.JSON,
    },
    author: {
        type: DataTypes.TEXT,
    },
    votingStartEpoch: {
        type: DataTypes.INTEGER,
    },
    votingEndEpoch: {
        type: DataTypes.INTEGER,
    },
    graceEpoch: {
        type: DataTypes.INTEGER,
    },
    contentJSON: {
        type: DataTypes.JSON,
    },
    status: {
        type: DataTypes.ENUM("ongoing", "finished", "upcoming"),
    },
    result: {
        type: DataTypes.ENUM("passed", "rejected"),
    },
    totalVotingPower: {
        type: DataTypes.TEXT,
    },
    totalYayPower: {
        type: DataTypes.TEXT,
    },
    totalNayPower: {
        type: DataTypes.TEXT,
    },
    totalAbstainPower: {
        type: DataTypes.TEXT,
    },
    tallyType: {
        type: DataTypes.ENUM(
            "OneHalfOverOneThird",
            "TwoThirds",
            "LessOneHalfOverOneThirdNay"
        ),
    },
});

export default Proposal;
