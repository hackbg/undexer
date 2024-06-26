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

export async function tryUpdateValidators (chain, height) {
  try {
    await updateValidators(chain, height)
  } catch (e) {
    console.error('Failed to update validators.')
    console.error(e)
  }
}

export async function updateValidators (chain, height) {
  console.log("=> Updating validators");
  const validators = Object.values(await chain.fetchValidators({
    parallel:        VALIDATOR_FETCH_PARALLEL,
    parallelDetails: VALIDATOR_FETCH_DETAILS_PARALLEL,
  }))
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
  return validators
}
