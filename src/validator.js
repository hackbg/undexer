#!/usr/bin/env node

import * as Namada from "@fadroma/namada";
const console = new Namada.Console(`Validators`)

import { deserialize } from "borsh";
import { retryForever } from "./utils.js";
import db, { withErrorLog, Validator } from './db.js'

import {
  VALIDATOR_FETCH_PARALLEL,
  VALIDATOR_FETCH_DETAILS_PARALLEL
} from './config.js';

export async function checkValidators (chain) {
  const validators = await chain.fetchValidators({
    details:         true,
    parallel:        VALIDATOR_FETCH_PARALLEL,
    parallelDetails: VALIDATOR_FETCH_DETAILS_PARALLEL,
  })
  await withErrorLog(() => db.transaction(async dbTransaction => {
    await Validator.destroy({ where: {} }, { transaction: dbTransaction });
    await Validator.bulkCreate(validators, { transaction: dbTransaction });
  }), {
    update: 'validators'
  })
  console.log(
    'Updated to', Object.keys(validators).length, 'validators'
  )
}

export async function updateValidators (chain, query, height) {
  console.log("=> Updating validators");
  const validators = await getValidators(chain, query)
  await withErrorLog(() => db.transaction(async dbTransaction => {
    for (const validatorData of validators) {
      await Validator.create(validatorData, { transaction: dbTransaction });
    }
  }), {
    update: 'validators',
    height
  })
}

export async function getValidators (chain, query) {
  const validatorsBinary = await getValidatorsFromNode(chain);
  const validators = []
  for (const validatorBinary of validatorsBinary) {
    const validator = await getValidator(query, chain, validatorBinary);
    //const validatorData = JSON.parse(serialize(validator));
    validators.push(validator);
  }
  return validators
}

export async function getValidatorsFromNode(chain) {
  const conn = chain.getConnection();
  const validatorsQuery = await conn.abciQuery("/vp/pos/validator/addresses");
  const validatorsDeserialized = deserialize(
    ValidatorSchema,
    validatorsQuery
  );
  return validatorsDeserialized;
}

export const ValidatorSchema = { set: { array: { type: "u8", len: 21, }, }, }

export async function getValidator (q, chain, validatorBinary) {
  const conn = chain.getConnection()
  const validator = await q.get_address_from_u8(validatorBinary)
  const timestamp = new Date().toISOString()
  const [
    metadata,
    stake,
    commission,
    state,
    publicKey,
  ] = await Promise.all([

    retryForever(
      "get metadata",   5000, (x) => conn.abciQuery(x), `/vp/pos/validator/metadata/${validator}`
    ).then(metadata=>{
      return conn.decode.pos_validator_metadata(metadata.slice(1))
    }),

    retryForever(
      "get stake",      5000, (x) => conn.abciQuery(x), `/vp/pos/validator/stake/${validator}`
    ).then(stake=>{
      return deserialize(StakeSchema, stake)
    }),

    retryForever(
      "get commission", 5000, (x) => conn.abciQuery(x), `/vp/pos/validator/commission/${validator}`
    ).then(commission=>{
      return conn.decode.pos_commission_pair(commission)
    }),

    retryForever(
      "get state",      5000, (x) => conn.abciQuery(x), `/vp/pos/validator/state/${validator}`
    ).then(state=>{
      return conn.decode.pos_validator_state(state)
    }),

    retryForever(
      "get pk",         5000, (x) => q.query_public_key(x), validator
    ),

  ])
  return {
    timestamp,
    validator,
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
