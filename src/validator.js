#!/usr/bin/env node

import * as Namada from "@fadroma/namada";
import { base16 } from '@hackbg/fadroma';
const console = new Namada.Console(`Validators`)

import { deserialize } from "borsh";
import { retryForever } from "./utils.js";
import db, { withErrorLog, Validator } from './db.js'

import {
  VALIDATOR_FETCH_PARALLEL,
  VALIDATOR_FETCH_DETAILS_PARALLEL
} from './config.js';

export async function tryUpdateValidators (chain, query) {
  try {
    await updateValidators(chain, query)
  } catch (e) {
    console.error('Failed to update validators.')
  }
}

export async function updateValidators (chain, query, height) {
  console.log("=> Updating validators");
  const validators = await getValidators(chain, query)
  await withErrorLog(() => db.transaction(async dbTransaction => {
    await Validator.destroy({ where: {} }, { transaction: dbTransaction });
    for (const validatorData of validators) {
      //console.log(validatorData)
      await Validator.create(validatorData, { transaction: dbTransaction });
    }
  }), {
    update: 'validators',
    height
  })
  console.log(
    'Updated to', Object.keys(validators).length, 'validators'
  )
}

export async function getValidators (chain, query) {
  const validators = []
  for (const address of await chain.fetchValidatorAddresses()) {
    validators.push(await getValidator(chain, query, address));
  }
  return validators
}

export async function getValidator (chain, query, namadaAddress) {
  const conn = chain.getConnection()
  const timestamp = new Date().toISOString()
  const [
    metadata, stake, commission, state, publicKey,
  ] = await Promise.all([

    retryForever(
      "get metadata", 5000,
      () => conn.abciQuery(`/vp/pos/validator/metadata/${namadaAddress}`),
    ).then(metadata=>{
      return conn.decode.pos_validator_metadata(metadata.slice(1))
    }),

    retryForever(
      "get stake", 5000,
      () => conn.abciQuery(`/vp/pos/validator/stake/${namadaAddress}`),
    ).then(stake=>{
      return deserialize(StakeSchema, stake)
    }),

    retryForever(
      "get commission", 5000,
      () => conn.abciQuery(`/vp/pos/validator/commission/${namadaAddress}`),
    ).then(commission=>{
      return conn.decode.pos_commission_pair(commission)
    }),

    retryForever(
      "get state", 5000,
      () => conn.abciQuery(`/vp/pos/validator/state/${namadaAddress}`),
    ).then(state=>{
      return conn.decode.pos_validator_state(state)
    }),

    //retryForever(
      //"get pk",         5000, () => query.query_public_key(namadaAddress),
    //),

    retryForever(
      "get public key", 5000,
      () => conn.abciQuery(`/vp/pos/validator/consensus_key/${namadaAddress}`),
    ).then(binary=>{
      if (!binary[0]) return null
      return base16.encode(binary.slice(1))
    }),

  ])

  return {
    timestamp,
    address: namadaAddress,
    namadaAddress,
    publicKey,
    metadata,
    stake,
    commission,
    state,
  }
}

export const StakeSchema = "u64";

/*
TODO: Save Consenssus validators to db
async function saveConsensusValidatorsToJSON() {
  const consensusValidators = await connection.fetchValidatorsConsensus();
  await save(
  'consensus_validators.json',
  consensusValidators.sort((a, b) => b.bondedStake - a.bondedStake)
);
}
*/

export function fetchValidators (chain) {
  return chain.fetchValidators({
    details:         true,
    allStates:       true,
    parallel:        VALIDATOR_FETCH_PARALLEL,
    parallelDetails: VALIDATOR_FETCH_DETAILS_PARALLEL,
  })
}

export async function getValidatorsFromNode (chain, query) {
  const conn = chain.getConnection();
  const validatorsQuery = await conn.abciQuery("/vp/pos/validator/addresses");
  const validatorsDeserialized = deserialize(
    ValidatorSchema,
    validatorsQuery
  );
  return await Promise.all([...validatorsDeserialized]
    .map(bytes=>query.get_address_from_u8(bytes)));
}

export const ValidatorSchema = { set: { array: { type: "u8", len: 21, }, }, }
