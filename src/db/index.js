import db, {
  serialize,
  DataTypes,
  IntegerPrimaryKey,
  StringPrimaryKey,
  JSONField,
} from './sequelize.js'

export default db

export { WASM_TO_CONTENT } from './Content.js'
export { default as Contents } from './Content.js'
export { withLogErrorToDB } from './ErrorLog.js'

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
