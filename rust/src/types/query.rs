use namada::{core::borsh::BorshSerialize};
use serde::Serialize;

#[derive(BorshSerialize)]
#[borsh(crate = "namada::core::borsh")]
pub struct ProposalInfo {
    pub id: String,
    pub proposal_type: String,
    pub author: String,
    pub start_epoch: u64,
    pub end_epoch: u64,
    pub grace_epoch: u64,
    pub content: String,
    pub status: String,
    pub result: String,
    pub total_voting_power: String,
    pub total_yay_power: String,
    pub total_nay_power: String,
    pub total_abstain_power: String,
    pub tally_type: String,
}

#[derive(BorshSerialize, Serialize)]
#[borsh(crate = "namada::core::borsh")]
pub struct ProtocolParameters {
    pub min_duration: String,
    pub min_num_of_blocks: String,
    pub max_block_duration: String,
    pub vp_allowlist: String,
    pub tx_allowlist: String,
    pub max_block_gas: String,
    pub fee_unshielding_gas_limit: String,
    pub fee_unshielding_descriptions_limit: String,
}