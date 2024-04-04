import EventEmitter from "node:events";
import { initialize, serialize } from "./utils";
import { getValidator, getValidatorsFromNode } from "./scripts/validator.js";
import { Query } from "./shared/pkg/shared";
import * as Namada from "@fadroma/namada";
import Block from "./models/Block";
import Proposal from "./models/Proposal";
import { UNDEXER_RPC_URL } from "./constants.js";
import { deserialize } from "borsh";
import { ProposalsSchema } from "./borsher-schema";
import Validator from "./models/Validator";
import sequelizer from "./db";
import TransactionManager from "./TransactionManager.js";

let isProcessingNewBlock = false;
let isProcessingUpdatePropoasls = false;
let isProcessingNewValidator = false;

await initialize();
sequelizer.init();

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
    if(blockHeightDb === undefined){
        eventEmitter.emit("updateBlocks", 237007, 237100);
    }
    else if (chainHeight > blockHeightDb) {
        console.log
        eventEmitter.emit("updateBlocks", blockHeightDb, chainHeight);
    }
    
    else {
        console.log('=====================================');
        console.log('No new blocks');
        console.log('=====================================');
    }
}

async function checkForNewProposal() {
    const proposalChainId = await q.last_proposal_id();
    const latestProposalDb = await Proposal.findOne({ raw:true, order: [["id", "DESC"]] })
    if (latestProposalDb === null) {
        eventEmitter.emit("updateProposals");
    }
    else if(latestProposalDb.id < proposalChainId) {
        eventEmitter.emit("updateProposals");
    }
    else {
        console.log('=====================================');
        console.log('No new proposals');
        console.log('=====================================');
    }
}

eventEmitter.on("updateBlocks", async (blockHeightDb, chainHeight) => {
    if(isProcessingNewBlock) return;
    isProcessingNewBlock = true;

    console.log('=====================================');
    console.log('Processing new block');
    console.log('=====================================');

    for(let i=blockHeightDb; i<=chainHeight; i++){
        const block = (await conn.getBlock(i)) as any;
        const { txsDecoded } = block;

        await Block.create(block);
        for(let tx of txsDecoded) {
            await TransactionManager.handleTransaction(tx, eventEmitter);
        }
    }
    isProcessingNewBlock=false;
});

eventEmitter.on("updateProposals", async () => {
    if(isProcessingUpdatePropoasls) return;
    isProcessingUpdatePropoasls = true;

    console.log('=====================================');
    console.log('Processing update proposals');
    console.log('=====================================');

    const proposalsBinary = await q.query_proposals();
    const proposals = deserialize(ProposalsSchema, proposalsBinary) as any;
    for (const proposal of proposals) {
        await Proposal.create(proposal);
    }
    isProcessingUpdatePropoasls=false;
})

eventEmitter.on("updateValidators", async () => {
    if(isProcessingNewValidator) return;
    isProcessingNewValidator=true;

    console.log('=====================================')
    console.log('Processing new validator')
    console.log('=====================================')

    const validatorsBinary = await getValidatorsFromNode(conn) as any;
    for (const validatorBinary of validatorsBinary) {
        const validator = await getValidator(q, conn, validatorBinary);
        await Validator.create(JSON.parse(serialize(validator)));        
    }

    isProcessingNewValidator=false;
});
