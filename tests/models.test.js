import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import test_block from '../data/block/1/block.json' with {type: "json"}
import transaction_json from '../data/block/1/tx-1.json' with {type: "json"}
import validator_json from '../data/validators/validator.json' with {type: "json"}
import proposal_json from '../data/proposal/1.json' with {type: "json"}
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';
import Proposal from '../models/Proposal.js'
import Validator from '../models/Validator.js'

describe('upload', ()=>{
    before(async ()=>{
        await Block.sync({force: true});
        await Transaction.sync({force: true});
        await Proposal.sync({force: true});
        await Validator.sync({force: true});
    });

    it("should upload blocks", async ()=>{
        const block = await Block.build(test_block);
        await block.save();

        const blocks = await Block.findAll();
        assert.strictEqual(blocks.length, 1)
    });

    it.only("should upload transactions", async ()=>{
        console.log(transaction_json.tx);
        const tx = await Transaction.build(transaction_json.tx);
        await tx.save();

        const txs = await Transaction.findAll();
        assert.strictEqual(txs.length, 1)
    })

    it("should upload proposal", async ()=>{
        const proposal = await Proposal.build(proposal_json);
        await proposal.save();

        const proposals = await Proposal.findAll();
        assert.strictEqual(proposals.length, 1)
    })

    it("should upload validators", async ()=>{
        const validator = await Validator.build(validator_json);
        await validator.save();

        const validators = await Validator.findAll();
        assert.strictEqual(validators.length, 1)
    })
});