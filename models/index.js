import sequelizer  from "../db";
import Validator from "./Validator";
import Proposal from "./Proposal";
import Block from "./Block";
import Transaction from "./Transaction";

Block.hasMany(Transaction);

module.exports = {
  sequelizer,
  Validator,
  Proposal,
  Block,
  Transaction,
};
