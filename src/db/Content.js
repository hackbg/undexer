import sequelize, { serialize, DataTypes } from './sequelize.js';

export const Content = sequelize.define('content');

// Content.hasOne(BecomeValidator);
// Content.hasOne(Bond);
// Content.hasOne(ChangeConsensusKey);
// Content.hasOne(ChangeValidatorComission);
// Content.hasOne(ChangeValidatorMetadata);
// Content.hasOne(ClaimRewards);
// Content.hasOne(DeactivateValidator);
// Content.hasOne(IBC);
// Content.hasOne(InitAccount);
// Content.hasOne(InitProposal);
// Content.hasOne(ReactivateValidator);
// Content.hasOne(ResignSteward);
// Content.hasOne(Transfer);
// Content.hasOne(Unbond);
// Content.hasOne(UnjailValidator);
// Content.hasOne(UpdateAccount);
// Content.hasOne(UpdateStewardCommission);
// Content.hasOne(VoteProposal);
// Content.hasOne(Withdraw);

export const

  BecomeValidator = sequelize.define("content_become_validator", {
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

  Bond = sequelize.define("content_bond", {
    validator: { type: DataTypes.TEXT, },
    amount:    { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  }),

  ChangeConsensusKey = sequelize.define("content_change_consensus_key", {
    consensusKey: { type: DataTypes.TEXT, },
    validator:    { type: DataTypes.TEXT, },
  }),

  ChangeValidatorComission = sequelize.define("content_change_validator_comission", {
    validator: { type: DataTypes.TEXT, },
    newRate:   { type: DataTypes.TEXT, },
  }),

  ChangeValidatorMetadata = sequelize.define('content_change_validator_metadata', {
    validator:      { type: DataTypes.TEXT, },
    commissionRate: { type: DataTypes.TEXT, },
    website:        { type: DataTypes.TEXT, },
    email:          { type: DataTypes.TEXT, },
    discordHandle:  { type: DataTypes.TEXT, },
    avatar:         { type: DataTypes.TEXT, },
    description:    { type: DataTypes.TEXT, },
  }),

  ClaimRewards = sequelize.define('content_claim_rewards', {
    validator: { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  }),

  DeactivateValidator = sequelize.define('content_deactivate_validator', {
    address: { type: DataTypes.TEXT, },
  }),

  IBC = sequelize.define('content_ibc', {
    'IBC': { type: DataTypes.TEXT, },
  }),

  InitAccount = sequelize.define("content_init_account", {
    publicKeys: { type: DataTypes.ARRAY(DataTypes.TEXT), },
    vpCodeHash: { type: DataTypes.TEXT, },
    threshold:  { type: DataTypes.INTEGER, },
  }),

  InitProposal = sequelize.define("content_init_proposal", {
    content:          { type: DataTypes.TEXT, },
    author:           { type: DataTypes.TEXT, },
    type:             { type: DataTypes.JSON, },
    votingStartEpoch: { type: DataTypes.INTEGER, },
    votingEndEpoch:   { type: DataTypes.INTEGER, },
    graceEpoch:       { type: DataTypes.INTEGER, },
    proposalId:       { type:DataTypes.INTEGER, }
  }),

  ReactivateValidator = sequelize.define("content_reactivate_validator", {
    address: { type: DataTypes.TEXT, },
  }),

  Redelegate = sequelize.define("content_redelegate", {
    srcValidator: { type: DataTypes.TEXT, },
    dstValidator: { type: DataTypes.TEXT, },
    owner:        { type: DataTypes.TEXT, },
    amount:       { type: DataTypes.TEXT, },
  }),

  ResignSteward = sequelize.define("content_resign_steward", {
    address: { type: DataTypes.TEXT, },
  }),

  RevealPK = sequelize.define("content_reveal_pk", {
    pk: { type: DataTypes.JSON },
  }),

  Transfer = sequelize.define("content_transfer", {
    source:   { type: DataTypes.TEXT, },
    target:   { type: DataTypes.TEXT, },
    token:    { type: DataTypes.TEXT, },
    amount:   { type: DataTypes.TEXT, },
    key:      { type: DataTypes.TEXT, },
    shielded: { type: DataTypes.TEXT, },
  }),

  Unbond = sequelize.define("content_unbond", {
    validator: { type: DataTypes.TEXT, },
    amount:    { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  }),

  UnjailValidator = sequelize.define("content_unjail_validator", {
    address: { type: DataTypes.TEXT, },
  }),

  UpdateAccount = sequelize.define("content_update_account", {
    address:    { type: DataTypes.TEXT, },
    vpCodeHash: { type: DataTypes.TEXT, },
    publicKeys: { type: DataTypes.ARRAY(DataTypes.TEXT), },
    threshold:  { type: DataTypes.TEXT, },
  }),

  UpdateStewardCommission = sequelize.define("content_update_steward_commission", {
    steward:    { type: DataTypes.TEXT, },
    commission: { type: DataTypes.JSON, },
  }),

  VoteProposal = sequelize.define("content_vote_proposal", {
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

  Withdraw = sequelize.define("content_withdraw", {
    validator: { type: DataTypes.TEXT, },
    source:    { type: DataTypes.TEXT, },
  })

export default {
  BecomeValidator,
  Bond,
  ChangeConsensusKey,
  ChangeValidatorComission,
  ChangeValidatorMetadata,
  ClaimRewards,
  DeactivateValidator,
  IBC,
  InitAccount,
  InitProposal,
  ReactivateValidator,
  Redelegate,
  ResignSteward,
  RevealPK,
  Transfer,
  Unbond,
  UnjailValidator,
  UpdateAccount,
  UpdateStewardCommission,
  VoteProposal,
  Withdraw,
};

export const WASM_TO_CONTENT = {
  'tx_become_validator.wasm': BecomeValidator,
  'tx_bond.wasm': Bond,
  'tx_change_consensus_key.wasm': ChangeConsensusKey,
  'tx_change_validator_commission.wasm': ChangeValidatorComission,
  'tx_change_validator_metadata.wasm': ChangeValidatorMetadata,
  'tx_claim_rewards.wasm': ClaimRewards,
  'tx_deactivate_validator.wasm': DeactivateValidator,
  'tx_ibc.wasm': IBC,
  'tx_init_account.wasm': InitAccount,
  'tx_init_proposal.wasm': InitProposal,
  'tx_reactivate_validator.wasm': ReactivateValidator,
  'tx_resign_steward.wasm': ResignSteward,
  'tx_redelegate.wasm': Redelegate,
  'tx_reveal_pk.wasm': RevealPK,
  'tx_transfer.wasm': Transfer,
  'tx_unbond.wasm': Unbond,
  'tx_unjail_validator.wasm': UnjailValidator,
  'tx_update_account.wasm': UpdateAccount,
  'tx_update_steward_commission.wasm': UpdateStewardCommission,
  'tx_vote_proposal.wasm': VoteProposal,
  'tx_withdraw.wasm': Withdraw,
}
