import sequelize, {
  serialize,
  DataTypes,
  IntegerPrimaryKey,
  StringPrimaryKey,
  JSONField,
} from './sequelize.js'
export default sequelize

export { Section } from './Section.js'
export { default as Sections } from './Section.js'

export { WASM_TO_CONTENT } from './Content.js'
export { Content } from './Content.js'
export { default as Contents } from './Content.js'
export { withLogErrorToDB } from './ErrorLog.js'

export const VALIDATOR_STATES = [
  "BelowThreshold",
  "BelowCapacity", 
  "Jailed",
  "Consensus",
  "Inactive"
]

export const Validator = sequelize.define('validator', {
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

export const Block = sequelize.define('block', {
  height:      IntegerPrimaryKey,
  id:          { type: DataTypes.TEXT, allowNull: false, },
  header:      JSONField('header'),
  results:     JSONField('results'),
  rpcResponse: JSONField('rpcResponse'),
})

export const Transaction = sequelize.define('transaction', {
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

export const Proposal = sequelize.define('proposal', {
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

export const Voter = sequelize.define("voter", {
  id:         IntegerPrimaryKey,
  vote:       { type: DataTypes.ENUM("yay", "nay", "abstain"), },
  power:      { type: DataTypes.TEXT, },
  voter:      { type: DataTypes.TEXT, },
  proposalId: { type: DataTypes.INTEGER, },
})
