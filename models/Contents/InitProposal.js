import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const InitProposal = sequelizer.define("content_init_proposal", {
    content: {
        type: DataTypes.TEXT,
    },
    author: {
        type: DataTypes.TEXT,
    },
    type: {
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
    proposalId: {
        type:DataTypes.INTEGER,
    }
});

export default InitProposal;
