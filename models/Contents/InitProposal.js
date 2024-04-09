import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const InitProposal = sequelizer.define("cnt_init_proposal", {
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

/*
    export const InitProposal = (props: {
  id: string;
  content: string;
  author: string;
  type: string;
  startEpoch: string;
  endEpoch: string;
  graceEpoch: string;
}) => (
  <>
    <Row name="Proposal ID:" value={props.id} />
    <Row name="Author:" value={props.author} />
    <Row name="Start epoch:" value={props.startEpoch} />
    <Row name="End epoch:" value={props.endEpoch} />
    <Row name="Grace epoch:" value={props.graceEpoch} />
    <Row name="Type:" value={props.type} />
    <Row name="Content:" value={props.content} />
  </>
);
*/
