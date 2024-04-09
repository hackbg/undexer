import EventEmitter from "node:events";
import { initialize, serialize } from "./utils.js";
import { getValidator, getValidatorsFromNode } from "./scripts/validator.js";
import { Query } from "./shared/pkg/shared.js";
import * as Namada from "@fadroma/namada";
import Block from "./models/Block.js";
import Proposal from "./models/Proposal.js";
import {
  NODE_LOWEST_BLOCK_HEIGHT,
  POST_UNDEXER_RPC_URL,
  PRE_UNDEXER_RPC_URL
} from "./constants.js";
import Validator from "./models/Validator.js";
import VoteProposal from "./models/Contents/VoteProposal.js";
import sequelizer from "./db/index.js";
import TransactionManager from "./TransactionManager.js";

let isProcessingNewBlock = false;
let isProcessingNewValidator = false;

await initialize();
sequelizer.sync({ force: true });

const eventEmitter = new EventEmitter();

setInterval(async () => {
    await checkForNewBlock();
}, 5000);

async function checkForNewBlock() {
    const blocks = await Block.findAll({ raw: true });
    const latestBlockInDb = blocks[blocks.length - 1];
    // should use newer node for the blockchain height
    const { conn } = getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1)
    let blockHeightDb = latestBlockInDb?.header.height;
    const currentBlockOnChain = await conn.height;
    const isDatabaseEmpty = blocks.length === 0;
    const isCurrentBlockInDbOld = blockHeightDb < (await conn.height);
    
    if (isDatabaseEmpty) {
        eventEmitter.emit("updateBlocks", 1, currentBlockOnChain);
    } else if (isCurrentBlockInDbOld) {
        eventEmitter.emit("updateBlocks", blockHeightDb, currentBlockOnChain);
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
    console.log("Processing new blocks");
    console.log("=====================================");

    for (let i = blockHeightDb; i <= chainHeight; i++) {
        const { conn } = getUndexerRPCUrl(i);
        const block = await conn.getBlock(i);
        const { txsDecoded } = block;

        await Block.create(block);
        for (let tx of txsDecoded) {
            await TransactionManager.handleTransaction(i, tx, eventEmitter);
        }
    }
    isProcessingNewBlock = false;
});


eventEmitter.on("updateValidators", async () => {
    if (isProcessingNewValidator) return;
    isProcessingNewValidator = true;

    const { q, conn } = getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1);

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
    const { q } = getUndexerRPCUrl(blockHeight);

    const proposal = await q.query_proposal(BigInt(proposalId));
    await VoteProposal.create(proposal);
});

function getUndexerRPCUrl(blockHeight) {
    if(blockHeight > NODE_LOWEST_BLOCK_HEIGHT) {
        return {
            q: new Query(POST_UNDEXER_RPC_URL),
            conn: Namada.testnet({ url: POST_UNDEXER_RPC_URL })
        }
    }
    else {
        return {
            q: new Query(PRE_UNDEXER_RPC_URL),
            conn: Namada.testnet({ url: PRE_UNDEXER_RPC_URL })
        }
    }
}
