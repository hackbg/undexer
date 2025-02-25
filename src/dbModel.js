import db, { console } from './db.js'
import { IntegerPrimaryKey, StringPrimaryKey, CompoundPrimaryKey } from './dbKeys.js'
import { JSONField, NullableJSONField } from './dbJson.js'
import { DataTypes } from "sequelize"
const { DATE, TEXT, BLOB, JSONB, INTEGER, BOOLEAN, BIGINT } = DataTypes

export const blockMeta = () => ({
  chainId:     { type: TEXT,    allowNull: false },
  blockHash:   { type: TEXT,    allowNull: false },
  blockHeight: { type: INTEGER, allowNull: false },
  blockTime:   { type: DATE },
})

/** Stored raw responses. */
export const RPCResponse = db.define('rpc_response', {
  id:        IntegerPrimaryKey(true),
  timestamp: { type: DATE, allowNull: false, },
  url:       { type: TEXT, allowNull: false, },
  response:  { type: TEXT, allowNull: false, },
})

/** Epochs with global per-epoch state. */
export const Epoch = db.define('epoch', {
  id:         IntegerPrimaryKey(true),
  totalStake: { type: BIGINT },
  parameters: JSONField('parameters')
})

/** Validators with per-epoch state. */
export const Validator = db.define('validator', {
  ...CompoundPrimaryKey({
    epoch:          { type: INTEGER, },
    namadaAddress:  { type: TEXT, },
  }),
  publicKey:        { type: TEXT, allowNull: true },
  consensusAddress: { type: TEXT, allowNull: true },
  votingPower:      { type: TEXT, allowNull: true },
  proposerPriority: { type: TEXT, allowNull: true },
  metadata:         NullableJSONField('metadata'),
  commission:       NullableJSONField('commission'),
  stake:            { type: TEXT, allowNull: true },
  state:            NullableJSONField('state')
})

/** Blocks by hash, with decoded per-block data from RPC. */
export const Block = db.define('block', {
  ...blockMeta(),
  epoch:       { type: INTEGER },
  blockHash:   StringPrimaryKey(), // primary key; overrides blockMeta().blockHash
  blockHeader: JSONField('blockHeader'),
})

/** Block data from RPC by hash. */
export const BlockDataResponse = db.define('block_data_response', {
  ...blockMeta(),
  blockHash: StringPrimaryKey(), // primary key; overrides blockMeta().blockHash
  blockData: NullableJSONField('blockData'),
})

/** Block result data from RPC by hash. */
export const BlockResultsResponse = db.define('block_results_response', {
  ...blockMeta(),
  blockHash:    StringPrimaryKey(), // primary key; overrides blockMeta().blockHash
  blockResults: NullableJSONField('blockResults'),
})

/** Transactions by hash, decoded from block data. */
export const Transaction = db.define('transaction', {
  ...blockMeta(),
  txHash: StringPrimaryKey(),
  txTime: { type: DATE },
  txData: JSONField('txData'),
})

/** Governance proposals by ID with per-proposal data. */
export const Proposal = db.define('proposal', {
  id:       IntegerPrimaryKey(),
  content:  NullableJSONField('content'),
  metadata: NullableJSONField('metadata'),
  result:   NullableJSONField('result'),
  initTx:   { type: TEXT, allowNull: true }
})

/** WASM blobs attached to governance proposals of certain types. */
export const ProposalWASM = db.define('proposal_wasm', {
  id:       IntegerPrimaryKey(),
  codeKey:  { type: TEXT },
  wasm:     { type: BLOB },
})

/** Governance votes per proposal/validator/delegator, with vote data. */
export const Vote = db.define("vote", {
  ...CompoundPrimaryKey({
    proposal:    { type: INTEGER, },
    validator:   { type: TEXT,    allowNull: true },
    delegator:   { type: TEXT,    allowNull: true },
    isValidator: { type: BOOLEAN, allowNull: true },
  }),
  data:   { type: TEXT, },
  voteTx: { type: TEXT, allowNull: true },
  power:  { type: TEXT, allowNull: true },
  height: { type: INTEGER, allowNull: true },
  epoch:  { type: INTEGER, allowNull: true },
})
