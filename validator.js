#!/usr/bin/env node
import * as Namada from "@fadroma/namada";
import { deserialize } from "borsh";
import { mkdirSync, readFileSync } from "node:fs";
import init, { Query } from "./shared/pkg/shared.js";
import { save } from "./utils.js";
import { StakeSchema, ValidatorSchema } from "./borsher-schema.js";

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
    process.chdir(process.env.UNDEXER_DATA_DIR);
} else {
    throw new Error("set UNDEXER_DATA_DIR");
}

try {
    mkdirSync("validators");
} catch (ex) {
    console.log("Validators already exists");
}

await saveAllValidatorsToJSON();

await saveValidatorPerJSON();

async function saveValidatorPerJSON() {
    const validatorsDeserialized = await getValidatorsFromNode();

    for (const validatorBinary of validatorsDeserialized) {
        const validator = await q.get_address_from_u8(validatorBinary);
        const validatorMetadata = await connection.abciQuery(
            `/vp/pos/validator/metadata/${validator}`
        );
        const stakeBinary = await connection.abciQuery(
            `/vp/pos/validator/stake/${validator}`
        );
        const comissionBinary = await connection.abciQuery(
            `/vp/pos/validator/commission/${validator}`
        );
        const stateBinary = await connection.abciQuery(
            `/vp/pos/validator/state/${validator}`
        );

        const metadata = await connection.decode.pos_validator_metadata(
            validatorMetadata.slice(1)
        );
        const stake = deserialize(StakeSchema, stakeBinary);
        const comission = await connection.decode.pos_commission_pair(
            comissionBinary.slice(1)
        );
        const state = await connection.decode.pos_validator_state(
            stateBinary.slice(1)
        );
        const publicKey = await q.query_public_key(validator);

        const validatorObj = {
            validator,
            metadata,
            stake,
            comission,
            state,
            publicKey,
        };
        await save(`${validator}.json`, validatorObj);
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
