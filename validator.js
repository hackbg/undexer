#!/usr/bin/env node
import * as Namada from "@fadroma/namada";
import { deserialize } from "borsh";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import init, { Query } from "./shared/pkg/shared.js";
import { save, retryForever } from "./utils.js";
import { StakeSchema, ValidatorSchema } from "./borsher-schema.js";
import 'dotenv/config';

await init(readFileSync("shared/pkg/shared_bg.wasm"));
await Namada.initDecoder(
    readFileSync("./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm")
);
const connection = Namada.testnet({
    url:
        process.env.UNDEXER_RPC_URL ||
        "https://namada-testnet-rpc.itrocket.net",
});

const q = new Query(
    process.env.UNDEXER_RPC_URL || "https://namada-testnet-rpc.itrocket.net"
);


if (process.env.UNDEXER_DATA_DIR) {
    await mkdirSync(process.env.UNDEXER_DATA_DIR+'/validators', {recursive: true});
    process.chdir(process.env.UNDEXER_DATA_DIR+'/validators');
} else {
    throw new Error("set UNDEXER_DATA_DIR");
}


await saveAllValidatorsToJSON();

await saveValidatorPerJSON();

await saveConsensusValidatorsToJSON();

async function saveValidatorPerJSON() {
    const validatorsDeserialized = await retryForever(
      'get validator list', 5000, getValidatorsFromNode
    );

    let index = 0
    for (const validatorBinary of validatorsDeserialized) {
        index++
        console.log(index, '/', validatorsDeserialized.size)
        const validator = await q.get_address_from_u8(validatorBinary)
        const file = `${validator}.json`
        if (existsSync(file)) {
            console.log(file, 'exists, skipping')
            continue
        }
        const t0 = performance.now()
        const [
          validatorMetadata,
          stakeBinary,
          commissionBinary,
          stateBinary,
          publicKey,
        ] = await Promise.all([
          retryForever(
            'get metadata',   5000, x=>connection.abciQuery(x), `/vp/pos/validator/metadata/${validator}`
          ),
          retryForever(
            'get stake',      5000, x=>connection.abciQuery(x), `/vp/pos/validator/stake/${validator}`
          ),
          retryForever(
            'get commission', 5000, x=>connection.abciQuery(x), `/vp/pos/validator/commission/${validator}`
          ),
          retryForever(
            'get state',      5000, x=>connection.abciQuery(x), `/vp/pos/validator/state/${validator}`
          ),
          retryForever(
            'get pk',         5000, x=>q.query_public_key(x),   validator
          )
        ])

        const validatorObj = {
            timestamp:  + new Date(),
            validator,
            publicKey,
            metadata:   connection.decode.pos_validator_metadata(validatorMetadata.slice(1)),
            stake:      deserialize(StakeSchema, stakeBinary),
            commission: connection.decode.pos_commission_pair(commissionBinary.slice(1)),
            state:      connection.decode.pos_validator_state(stateBinary.slice(1)),
        };

        await save(file, validatorObj);
        console.log('took', performance.now() - t0, 'msec')
    }
}

async function getValidatorsFromNode() {
    const validatorsQuery = await connection.abciQuery(
        "/vp/pos/validator/addresses"
    );
    const validatorsDeserialized = deserialize(
        ValidatorSchema,
        validatorsQuery
    );
    return validatorsDeserialized;
}

async function saveAllValidatorsToJSON() {
    const validatorsDeserialized = await getValidatorsFromNode();
    const validatorsString = [];

    for (const validatorBinary of validatorsDeserialized) {
        const validatorString = await q.get_address_from_u8(validatorBinary);
        validatorsString.push(validatorString);
    }

    await save("all_validators.json", validatorsString);
    return validatorsDeserialized;
}

async function saveConsensusValidatorsToJSON() {
  const consensusValidators = await connection.getValidatorsConsensus();
  await save(
    'consensus_validators.json',
    consensusValidators.sort((a, b) => b.bondedStake - a.bondedStake)
  );
}