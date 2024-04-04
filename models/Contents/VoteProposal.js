import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const VoteProposal = sequelizer.define("voteProposal", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    vote: {
        type: DataTypes.STRING,
    },
    voter: {
        type: DataTypes.STRING,
    },
    delegations: {
        type: DataTypes.ARRAY(DataTypes.STRING),
    },
});

export default VoteProposal;