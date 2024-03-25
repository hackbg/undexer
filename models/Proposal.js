import { DataTypes } from "sequelize";

const Proposal = {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    proposalType: {
        type: DataTypes.ENUM("pgf_steward", "pgf_funding", "pgf_governance"),
        allowNull: false,
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    startEpoch: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    endEpoch: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    graceEpoch: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    contentJSON: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("active", "finished", "rejected"),
        allowNull: false,
    },
    result: {
        type: DataTypes.ENUM("passed", "rejected"),
        allowNull: false,
    },
    totalVotingPower: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    totalYayPower: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    totalNayPower: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    totalAbstainPower: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tallyType: {
        type: DataTypes.ENUM(
            "OneHalfOverOneThird",
            "TwoThirds",
            "LessOneHalfOverOneThirdNay"
        ),
        allowNull: false,
    },
};

export default Proposal;