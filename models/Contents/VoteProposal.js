import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";
import { serialize } from '../serialize';

const VoteProposal = sequelizer.define("content_vote_proposal", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    proposalId: {
        type: DataTypes.INTEGER,
        get() {
            return JSON.parse(this.getDataValue('proposalId'));
        },
        set(value) {
            return this.setDataValue('proposalId', serialize(value));
        },
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
