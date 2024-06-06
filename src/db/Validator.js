import sequelize, { DataTypes } from './sequelize.js';

const Validator = sequelize.define('validator', {
  address: {
    type: DataTypes.TEXT,
  },
  publicKey: {
    type: DataTypes.TEXT,
  },
  votingPower: {
    type: DataTypes.TEXT,
  },
  proposerPriority:{
    type: DataTypes.TEXT,
  },
  namadaAddress: {
    type: DataTypes.TEXT,
  },
  metadata: {
    type: DataTypes.JSON,
  },
  commission: {
    type: DataTypes.JSON,
  },
  state: DataTypes.ENUM(
    "BelowThreshold",
    "BelowCapacity", 
    "Jailed",
    "Consensus",
    "Inactive"
  ),
  stake: {
    type: DataTypes.TEXT,
  },
});

export default Validator;
