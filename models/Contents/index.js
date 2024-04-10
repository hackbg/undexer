import BecomeValidator from './BecomeValidator.js';
import Bond from './Bond.js';
import ChangeConsensusKey from './ChangeConsensusKey.js';
import ChangeValidatorComission from './ChangeValidatorComission.js';
import ChangeValidatorMetadata from './ChangeValidatorMetadata.js';
import ClaimRewards from './ClaimRewards.js';
import DeactivateValidator from './DeactivateValidator.js';
import IBC from './IBC.js';
import InitAccount from './InitAccount.js';
import InitProposal from './InitProposal.js';
import ReactivateValidator from './ReactivateValidator.js';
import Redelegate from './Redelegate.js';
import ResignSteward from './ResignSteward.js';
import RevealPK from './RevealPK.js';
import Transfer from './Transfer.js';
import Unbond from './Unbond.js';
import UnjailValidator from './UnjailValidator.js';
import UpdateAccount from './UpdateAccount.js';
import UpdateStewardCommission from './UpdateStewardComission.js';
import VoteProposal from './VoteProposal.js';
import Withdraw from './Withdraw.js';

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
