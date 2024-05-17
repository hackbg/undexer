import sequelize from "../db/index.js";
const Content = sequelize.define('content');

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

export default Content;