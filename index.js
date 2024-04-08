import EventEmitter from "node:events";
import { initialize, serialize } from "./utils.js";
import { getValidator, getValidatorsFromNode } from "./scripts/validator.js";
import { Query } from "./shared/pkg/shared.js";
import * as Namada from "@fadroma/namada";
import Block from "./models/Block.js";
import Proposal from "./models/Proposal.js";
import { UNDEXER_RPC_URL } from "./constants.js";
import Validator from "./models/Validator.js";
import sequelizer from "./db/index.js";
import TransactionManager from "./TransactionManager.js";

let isProcessingNewBlock = false;
let isProcessingUpdatePropoasls = false;
let isProcessingNewValidator = false;

await initialize();
sequelizer.sync({ force: true });

const eventEmitter = new EventEmitter();
const conn = Namada.testnet({ url: UNDEXER_RPC_URL });
const q = new Query(UNDEXER_RPC_URL);

setInterval(async () => {
    await checkForNewBlock();
    await checkForNewProposal();
}, 5000);

async function checkForNewBlock() {
    const blocks = await Block.findAll({ raw: true });
    const latestBlockInDb = blocks[blocks.length - 1];
    let blockHeightDb = latestBlockInDb?.header.height;
    const chainHeight = await conn.height;
    if (blockHeightDb === undefined) {
        eventEmitter.emit("updateBlocks", 237907, chainHeight);
    } else if (chainHeight > blockHeightDb) {
        console.log;
        eventEmitter.emit("updateBlocks", blockHeightDb, chainHeight);
    } else {
        console.log("=====================================");
        console.log("No new blocks");
        console.log("=====================================");
    }
}

eventEmitter.on("updateBlocks", async (blockHeightDb, chainHeight) => {
    if (isProcessingNewBlock) return;
    isProcessingNewBlock = true;

    console.log("=====================================");
    console.log("Processing new block");
    console.log("=====================================");

    for (let i = blockHeightDb; i <= chainHeight; i++) {
        const block = await conn.getBlock(i);
        const { txsDecoded } = block;

        await Block.create(block);
        for (let tx of txsDecoded) {
            await TransactionManager.handleTransaction(tx, eventEmitter);
        }
    }
    isProcessingNewBlock = false;
});


eventEmitter.on("updateValidators", async () => {
    if (isProcessingNewValidator) return;
    isProcessingNewValidator = true;

    console.log("=====================================");
    console.log("Processing new validator");
    console.log("=====================================");

    const validatorsBinary = await getValidatorsFromNode(conn);
    for (const validatorBinary of validatorsBinary) {
        const validator = await getValidator(q, conn, validatorBinary);
        await Validator.create(JSON.parse(serialize(validator)));
    }

    isProcessingNewValidator = false;
});

eventEmitter.on("createProposal", async (txData) => {
    await Proposal.create(txData);
});

eventEmitter.on("updateProposal", async (proposalId, blockHeight) => {
    await Proposal.destroy({ where: { id: proposalId } });
    const q = getUndexerRPCUrl(blockHeight);

    const proposal = await q.query_proposal(proposalId);
    await VoteProposal.create(proposal);
});
