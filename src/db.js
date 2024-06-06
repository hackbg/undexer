import { Console } from "@hackbg/logs"
const console = new Console("DB");

import { Sequelize } from "sequelize"
import { DATABASE_URL } from "./config.js"
const db = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
  supportBigNumbers: true,
})
export default db

import { DataTypes } from "sequelize"
export { DataTypes }

export function serialize (object) {
  return JSON.stringify(object, (k, v)=>{
    if (typeof v === 'bigint') {
      return String(v)
    }
    return v
  })
}

export const IntegerPrimaryKey = {
  type:       DataTypes.INTEGER,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
}

export const StringPrimaryKey = {
  type:       DataTypes.TEXT,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
}

export const JSONField = name => ({
  type: DataTypes.JSON,
  allowNull: false,
  get() {
    return JSON.parse(this.getDataValue(name));
  },
  set(value) {
    return this.setDataValue(name, serialize(value));
  },
})

export const VALIDATOR_STATES = [
  "BelowThreshold",
  "BelowCapacity", 
  "Jailed",
  "Consensus",
  "Inactive"
]

export const Validator = db.define('validator', {
  address:          StringPrimaryKey,
  publicKey:        { type: DataTypes.TEXT, },
  votingPower:      { type: DataTypes.TEXT, },
  proposerPriority: { type: DataTypes.TEXT, },
  namadaAddress:    { type: DataTypes.TEXT, },
  metadata:         { type: DataTypes.JSON, },
  commission:       { type: DataTypes.JSON, },
  stake:            { type: DataTypes.TEXT, },
  state:            DataTypes.ENUM(...VALIDATOR_STATES)
})

export const Block = db.define('block', {
  height:      IntegerPrimaryKey,
  id:          { type: DataTypes.TEXT, allowNull: false, },
  header:      JSONField('header'),
  results:     JSONField('results'),
  rpcResponse: JSONField('rpcResponse'),
})

export const Transaction = db.define('transaction', {
  txId:                StringPrimaryKey,
  blockId:             { type: DataTypes.TEXT, },
  blockHeight:         { type: DataTypes.INTEGER, },
  chainId:             { type: DataTypes.TEXT, },
  expiration:          { type: DataTypes.DATE, },
  timestamp:           { type: DataTypes.DATE, },
  codeHash:            { type: DataTypes.TEXT, },
  dataHash:            { type: DataTypes.TEXT, },
  memoHash:            { type: DataTypes.TEXT, },
  type:                { type: DataTypes.TEXT, },
  feeAmountPerGasUnit: { type: DataTypes.TEXT, },
  feeToken:            { type: DataTypes.TEXT, },
  multiplier:          { type: DataTypes.TEXT, },
  gasLimitMultiplier:  { type: DataTypes.TEXT, },
  sections:            { type: DataTypes.JSONB, },
  content:             { type: DataTypes.JSONB, },
})

Block.hasMany(Transaction);

export const PROPOSAL_STATUS = [
  "ongoing",
  "finished",
  "upcoming",
]

export const PROPOSAL_RESULT = [
  "passed",
  "rejected",
]

export const PROPOSAL_TALLY_TYPE = [
  "OneHalfOverOneThird",
  "TwoThirds",
  "LessOneHalfOverOneThirdNay"
]

export const Proposal = db.define('proposal', {
  id:                IntegerPrimaryKey,
  proposalType:      { type: DataTypes.TEXT, },
  author:            { type: DataTypes.TEXT, },
  startEpoch:        { type: DataTypes.INTEGER, },
  endEpoch:          { type: DataTypes.INTEGER, },
  graceEpoch:        { type: DataTypes.INTEGER, },
  contentJSON:       { type: DataTypes.JSON, },
  status:            { type: DataTypes.ENUM(...PROPOSAL_STATUS), },
  result:            { type: DataTypes.ENUM(...PROPOSAL_RESULT), },
  totalVotingPower:  { type: DataTypes.TEXT, },
  totalYayPower:     { type: DataTypes.TEXT, },
  totalNayPower:     { type: DataTypes.TEXT, },
  totalAbstainPower: { type: DataTypes.TEXT, },
  tallyType:         { type: DataTypes.ENUM(...PROPOSAL_TALLY_TYPE) }
})

export const Voter = db.define("voter", {
  id:         IntegerPrimaryKey,
  vote:       { type: DataTypes.ENUM("yay", "nay", "abstain"), },
  power:      { type: DataTypes.TEXT, },
  voter:      { type: DataTypes.TEXT, },
  proposalId: { type: DataTypes.INTEGER, },
})

export const Sections = {
  Cipher: db.define('section_cipher', {
    cipherText: { type: DataTypes.TEXT },
  }),

  Code: db.define('section_code', {
    salt: { type: DataTypes.TEXT },
    code: { type: DataTypes.TEXT },
    tag:  { type: DataTypes.TEXT },
  }),

  Data: db.define('section_data', {
    salt: { type: DataTypes.TEXT, },
    data: { type: DataTypes.TEXT, },
  }),

  ExtraData: db.define('section_extra_data', {
    salt: { type: DataTypes.TEXT, },
    code: { type: DataTypes.TEXT, },
    tag:  { type: DataTypes.TEXT, },
  }),

  Header: db.define("section_header", {
    type:       { type: DataTypes.TEXT },
    chainId:    { type: DataTypes.TEXT },
    expiration: { type: DataTypes.TEXT },
    timestamp:  { type: DataTypes.TEXT },
    codeHash:   { type: DataTypes.TEXT },
    dataHash:   { type: DataTypes.TEXT },
    memoHash:   { type: DataTypes.TEXT },
    txType:     { type: DataTypes.TEXT },
  }),

  MaspBuilder: db.define("section_masp_builder", {
    type:     { type: DataTypes.TEXT },
    target:   { type: DataTypes.TEXT },
    token:    { type: DataTypes.TEXT },
    denom:    { type: DataTypes.TEXT },
    position: { type: DataTypes.TEXT },
  }),

  MaspTx: db.define("section_masp_tx", {
    type:              { type: DataTypes.TEXT },
    txid:              { type: DataTypes.TEXT },
    lockTime:          { type: DataTypes.TEXT },
    expiryHeight:      { type: DataTypes.TEXT },
    transparentBundle: { type: DataTypes.JSON },
    saplingBundle:     { type: DataTypes.JSON },
  }),

  Signature: db.define('section_signature', {
    targets: { type: DataTypes.ARRAY(DataTypes.TEXT) },
    signatures: { type: DataTypes.JSON },
    signer: {
      type: DataTypes.TEXT,
      get() {
        try {
          return JSON.parse(this.getDataValue('signer'));
        } catch (e) {
          return null;
        }
      },
      set(value) {
        this.setDataValue('signer', serialize(value));
      },
    },
  })
}

export const ErrorLog = db.define('error_log', {
  id:        { type: DataTypes.INTEGER, allowNull: false, unique: true, primaryKey: true },
  timestamp: { type: DataTypes.DATE },
  message:   { type: DataTypes.TEXT },
  stack:     { type: DataTypes.JSON },
  info:      { type: DataTypes.JSON, allowNull: true },
})

export function logErrorToDB (error, info) {
  return ErrorLog.create({
    timestamp: new Date(),
    message:   error.message,
    stack:     error.stack,
    info
  })
}

export function withErrorLog (callback, info) {
  try {
    return callback()
  } catch (e) {
    console.error('Logging error to database', e)
    logErrorToDB(error, info)
  }
}

export const Contents = {

  BecomeValidator: db.define("content_become_validator", {
    address:                 { type: DataTypes.TEXT, },
    consensusKey:            { type: DataTypes.TEXT, },
    ethColdKey:              { type: DataTypes.TEXT, },
    ethHotKey:               { type: DataTypes.TEXT, },
    protocolKey:             { type: DataTypes.TEXT, },
    commissionRate:          { type: DataTypes.TEXT, },
    maxCommissionRateChange: { type: DataTypes.TEXT, },
    website:                 { type: DataTypes.TEXT, },
    email:                   { type: DataTypes.TEXT, },
    discordHandle:           { type: DataTypes.TEXT, },
    avatar:                  { type: DataTypes.TEXT, },
    description:             { type: DataTypes.TEXT, },
  }),

  Bond: db.define("content_bond", {
    validator: { type: DataTypes.TEXT, },
    amount:    { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  }),

  ChangeConsensusKey: db.define("content_change_consensus_key", {
    consensusKey: { type: DataTypes.TEXT, },
    validator:    { type: DataTypes.TEXT, },
  }),

  ChangeValidatorComission: db.define("content_change_validator_comission", {
    validator: { type: DataTypes.TEXT, },
    newRate:   { type: DataTypes.TEXT, },
  }),

  ChangeValidatorMetadata: db.define('content_change_validator_metadata', {
    validator:      { type: DataTypes.TEXT, },
    commissionRate: { type: DataTypes.TEXT, },
    website:        { type: DataTypes.TEXT, },
    email:          { type: DataTypes.TEXT, },
    discordHandle:  { type: DataTypes.TEXT, },
    avatar:         { type: DataTypes.TEXT, },
    description:    { type: DataTypes.TEXT, },
  }),

  ClaimRewards: db.define('content_claim_rewards', {
    validator: { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  }),

  DeactivateValidator: db.define('content_deactivate_validator', {
    address: { type: DataTypes.TEXT, },
  }),

  IBC: db.define('content_ibc', {
    'IBC': { type: DataTypes.TEXT, },
  }),

  InitAccount: db.define("content_init_account", {
    publicKeys: { type: DataTypes.ARRAY(DataTypes.TEXT), },
    vpCodeHash: { type: DataTypes.TEXT, },
    threshold:  { type: DataTypes.INTEGER, },
  }),

  InitProposal: db.define("content_init_proposal", {
    content:          { type: DataTypes.TEXT, },
    author:           { type: DataTypes.TEXT, },
    type:             { type: DataTypes.JSON, },
    votingStartEpoch: { type: DataTypes.INTEGER, },
    votingEndEpoch:   { type: DataTypes.INTEGER, },
    graceEpoch:       { type: DataTypes.INTEGER, },
    proposalId:       { type:DataTypes.INTEGER, }
  }),

  ReactivateValidator: db.define("content_reactivate_validator", {
    address: { type: DataTypes.TEXT, },
  }),

  Redelegate: db.define("content_redelegate", {
    srcValidator: { type: DataTypes.TEXT, },
    dstValidator: { type: DataTypes.TEXT, },
    owner:        { type: DataTypes.TEXT, },
    amount:       { type: DataTypes.TEXT, },
  }),

  ResignSteward: db.define("content_resign_steward", {
    address: { type: DataTypes.TEXT, },
  }),

  RevealPK: db.define("content_reveal_pk", {
    pk: { type: DataTypes.JSON },
  }),

  Transfer: db.define("content_transfer", {
    source:   { type: DataTypes.TEXT, },
    target:   { type: DataTypes.TEXT, },
    token:    { type: DataTypes.TEXT, },
    amount:   { type: DataTypes.TEXT, },
    key:      { type: DataTypes.TEXT, },
    shielded: { type: DataTypes.TEXT, },
  }),

  Unbond: db.define("content_unbond", {
    validator: { type: DataTypes.TEXT, },
    amount:    { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  }),

  UnjailValidator: db.define("content_unjail_validator", {
    address: { type: DataTypes.TEXT, },
  }),

  UpdateAccount: db.define("content_update_account", {
    address:    { type: DataTypes.TEXT, },
    vpCodeHash: { type: DataTypes.TEXT, },
    publicKeys: { type: DataTypes.ARRAY(DataTypes.TEXT), },
    threshold:  { type: DataTypes.TEXT, },
  }),

  UpdateStewardCommission: db.define("content_update_steward_commission", {
    steward:    { type: DataTypes.TEXT, },
    commission: { type: DataTypes.JSON, },
  }),

  VoteProposal: db.define("content_vote_proposal", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, },
    proposalId: {
      type: DataTypes.INTEGER,
      get () { return JSON.parse(this.getDataValue('proposalId')); },
      set (value) { return this.setDataValue('proposalId', serialize(value)); },
    },
    vote:        { type: DataTypes.TEXT, },
    voter:       { type: DataTypes.TEXT, },
    delegations: { type: DataTypes.ARRAY(DataTypes.TEXT), },
  }),

  Withdraw: db.define("content_withdraw", {
    validator: { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  }),

};

export const WASM_TO_CONTENT = {
  'tx_become_validator.wasm': Contents.BecomeValidator,
  'tx_bond.wasm': Contents.Bond,
  'tx_change_consensus_key.wasm': Contents.ChangeConsensusKey,
  'tx_change_validator_commission.wasm': Contents.ChangeValidatorComission,
  'tx_change_validator_metadata.wasm': Contents.ChangeValidatorMetadata,
  'tx_claim_rewards.wasm': Contents.ClaimRewards,
  'tx_deactivate_validator.wasm': Contents.DeactivateValidator,
  'tx_ibc.wasm': Contents.IBC,
  'tx_init_account.wasm': Contents.InitAccount,
  'tx_init_proposal.wasm': Contents.InitProposal,
  'tx_reactivate_validator.wasm': Contents.ReactivateValidator,
  'tx_resign_steward.wasm': Contents.ResignSteward,
  'tx_redelegate.wasm': Contents.Redelegate,
  'tx_reveal_pk.wasm': Contents.RevealPK,
  'tx_transfer.wasm': Contents.Transfer,
  'tx_unbond.wasm': Contents.Unbond,
  'tx_unjail_validator.wasm': Contents.UnjailValidator,
  'tx_update_account.wasm': Contents.UpdateAccount,
  'tx_update_steward_commission.wasm': Contents.UpdateStewardCommission,
  'tx_vote_proposal.wasm': Contents.VoteProposal,
  'tx_withdraw.wasm': Contents.Withdraw,
}
