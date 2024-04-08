import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const VoteProposal = sequelizer.define("cntvote_proposal", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    proposalId: {
        type: DataTypes.INTEGER,
    },
    vote: {
        type: DataTypes.TEXT,
    },
    voter: {
        type: DataTypes.TEXT,
    },
    delegations: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
});

export default VoteProposal;