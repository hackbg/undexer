import { readFileSync } from "node:fs";
import init from "./shared/pkg/shared.js";
import * as Namada from "@fadroma/namada";
import { Core } from "@fadroma/agent";
import BecomeValidator from './models/Contents/BecomeValidator.js';
import Bond from './models/Contents/Bond.js';
import ChangeConsensusKey from './models/Contents/ChangeConsensusKey.js';
import ChangeValidatorComission from './models/Contents/ChangeValidatorComission.js';
import ChangeValidatorMetadata from './models/Contents/ChangeValidatorMetadata.js';
import ClaimRewards from './models/Contents/ClaimRewards.js';
import DeactivateValidator from './models/Contents/DeactivateValidator.js';
import IBC from './models/Contents/IBC.js';
import InitAccount from './models/Contents/InitAccount.js';
import InitProposal from './models/Contents/InitProposal.js';
import ReactivateValidator from './models/Contents/ReactivateValidator.js';
import ResignSteward from './models/Contents/ResignSteward.js';
import RevealPK from './models/Contents/RevealPK.js';
import Transfer from './models/Contents/Transfer.js';
import Unbond from './models/Contents/Unbond.js';
import UnjailValidator from './models/Contents/UnjailValidator.js';
import UpdateAccount from './models/Contents/UpdateAccount.js';
import UpdateStewardCommission from './models/Contents/UpdateStewardComission.js';
import VoteProposal from './models/Contents/VoteProposal.js';
import Withdraw from './models/Contents/Withdraw.js';


export const NODE_LOWEST_BLOCK_HEIGHT = 237907;

export function serialize(data) {
    return JSON.stringify(data, stringifier);
}

export function stringifier(key, value) {
    if (typeof value === "bigint") {
        return value.toString();
    }
    if (value instanceof Uint8Array) {
        return Core.base64.encode(value);
    }
    return value;
}

export function waitFor (msec) {
    return new Promise(resolve=>setTimeout(resolve, msec))
}

export async function retryForever (operation, interval, callback, ...args) {
  while (true) {
    try {
      return await callback(...args)
    } catch (e) {
      console.error(`Failed to ${operation}, waiting ${interval}ms and retrying`)
      await waitFor(interval)
    }
  }
}

// TYPE TO MODEL 
export const SectionTypeToModel = {
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
    'tx_reveal_pk.wasm': RevealPK,
    'tx_transfer.wasm': Transfer,
    'tx_unbond.wasm': Unbond,
    'tx_unjail_validator.wasm': UnjailValidator,
    'tx_update_account.wasm': UpdateAccount,
    'tx_update_steward_commission.wasm': UpdateStewardCommission,
    'tx_vote_proposal.wasm': VoteProposal,
    'tx_withdraw.wasm': Withdraw,
}


export async function initialize() {
    await init(readFileSync("shared/pkg/shared_bg.wasm"));
    await Namada.initDecoder(
        readFileSync("./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm")
    );
}

export function format(txContent){
  const result = Object.assign(txContent);

  if(result.type==="tx_vote_proposal.wasm" || result.type==="tx_init_proposal.wasm"){
    result.data.proposalId = result.data.id;
    delete result.data.id;
  }

  return result;
}
