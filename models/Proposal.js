import { DataTypes } from "sequelize";
import sequelizer from "../db/index.js";

const Proposal = sequelizer.define('proposal', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    proposalType: {
        type: DataTypes.ENUM("PGFSteward", "PGFFunding", "PGFGovernance", "Default", "PGFPayment"),
        allowNull: false,
    },
    author: {
        type: DataTypes.TEXT,
    },
    votingStartEpoch: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    votingEndEpoch: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    graceEpoch: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    contentJSON: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("ongoing", "finished", "rejected"),
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
