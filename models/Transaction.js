import { DataTypes } from "sequelize";

const Transaction = {
    chainId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expiration: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    codehash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    datahash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    memohash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    txType: {
        type: DataTypes.ENUM(
            "BecomeValidator",
            "Bond",
            "ChangeConsensusKey",
            "ChangeValidatorCommission",
            "ChangeValidatorMetadata",
            "ClaimRewards",
            "DeactivateValidator",
            "InitAccount",
            "InitProposal",
            "ReactivateValidator",
            "ResignSteward",
            "RevealPK",
            "Transfer",
            "Unbond",
            "UnjailValidator",
            "UpdateAccount",
            "UpdateStewardCommission",
            "VoteProposal",
            "Withdraw",
            "IBC"
        ),
        allowNull: false,
    },
    section: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    content: {
        type: DataTypes.JSON,
        allowNull: false,
    },
};

export default Transaction;