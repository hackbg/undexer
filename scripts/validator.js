#!/usr/bin/env node
import * as Namada from "@fadroma/namada";
import { deserialize } from "borsh";
import { readFileSync } from "node:fs";
import init, { Query } from "../shared/pkg/shared.js";
import { retryForever } from "../utils.js";
import { StakeSchema, ValidatorSchema } from "../borsher-schema.js";
import "dotenv/config";
import Validator from "../models/Validator.js";
import { POST_UNDEXER_RPC_URL } from "../constants.js";

await init(readFileSync("shared/pkg/shared_bg.wasm"));
await Namada.initDecoder(
    readFileSync("./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm")
);

export async function saveValidatorToDb() {
    const validatorsDeserialized = await retryForever(
        "get validator list",
        5000,
        getValidatorsFromNode
    );

    const q = new Query(UNDEXER_RPC_URL);
    const conn = Namada.testnet({ url: POST_UNDEXER_RPC_URL });

    for (const validatorBinary of validatorsDeserialized) {
        const validatorObj = await getValidator(q, conn, validatorBinary);
        await Validator.create(validatorObj);
        console.log("took", performance.now() - t0, "msec");
    }
}

export async function getValidator(q, conn, validatorBinary) {
    const validator = await q.get_address_from_u8(validatorBinary);
    const [
        validatorMetadata,
        stakeBinary,
        commissionBinary,
        stateBinary,
        publicKey,
    ] = await Promise.all([
        retryForever(
            "get metadata",
            5000,
            (x) => conn.abciQuery(x),
            `/vp/pos/validator/metadata/${validator}`
        ),
        retryForever(
            "get stake",
            5000,
            (x) => conn.abciQuery(x),
            `/vp/pos/validator/stake/${validator}`
        ),
        retryForever(
            "get commission",
            5000,
            (x) => conn.abciQuery(x),
            `/vp/pos/validator/commission/${validator}`
        ),
        retryForever(
            "get state",
            5000,
            (x) => conn.abciQuery(x),
            `/vp/pos/validator/state/${validator}`
        ),
        retryForever("get pk", 5000, (x) => q.query_public_key(x), validator),
    ]);

    return {
        timestamp: +new Date(),
        validator,
        publicKey,
        metadata: conn.decode.pos_validator_metadata(
            validatorMetadata.slice(1)
        ),
        stake: deserialize(StakeSchema, stakeBinary),
        commission: conn.decode.pos_commission_pair(commissionBinary.slice(1)),
        state: conn.decode.pos_validator_state(stateBinary.slice(1)),
    };
}

export async function getValidatorsFromNode(conn) {
    const validatorsQuery = await conn.abciQuery("/vp/pos/validator/addresses");
    const validatorsDeserialized = deserialize(
        ValidatorSchema,
        validatorsQuery
    );
    return validatorsDeserialized;
}

/*
TODO: Save Consenssus validators to db
async function saveConsensusValidatorsToJSON() {
  const consensusValidators = await connection.getValidatorsConsensus();
  await save(
    'consensus_validators.json',
  consensusValidators.sort((a, b) => b.bondedStake - a.bondedStake)
);
}
*/
