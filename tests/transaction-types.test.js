import assert from "node:assert";
import { describe, it, before } from "node:test";

import Models from "../models/Contents/index.js";

const {
    BecomeValidator,
    Bond,
    IBC,
    VoteProposal,
    Transfer,
    UnjailValidator,
    ClaimRewards,
    Withdraw,
    UpdateAccount,
    InitAccount,
    InitProposal,
    ChangeValidatorMetadata,
    Unbond,
    ChangeConsensusKey,
    RevealPK,
    ChangeValidatorComission,
    ResignSteward,
    UpdateStewardCommission,
    ReactivateValidator,
} = Models;

describe("upload transactions", async () => {
    const transactions = [
        { blockId: 169024, txId: 0, model: Bond },
        { blockId: 1004, txId: 1, model: BecomeValidator },
        { blockId: 169024, txId: 1, model: IBC },
        { blockId: 169024, txId: 1, model: VoteProposal },
        { blockId: 169024, txId: 2, model: Transfer },
        { blockId: 169931, txId: 4, model: UnjailValidator },
        { blockId: 271188, txId: 1, model: ClaimRewards },
        { blockId: 271188, txId: 2, model: Withdraw },
        { blockId: 270842, txId: 0, model: UpdateAccount },
        { blockId: 12, txId: 10, model: InitAccount },
        { blockId: 1124, txId: 1, model: InitProposal },
        { blockId: 1400, txId: 4, model: ChangeValidatorMetadata },
        { blockId: 1409, txId: 0, model: Unbond },
        { blockId: 1549, txId: 2, model: ChangeConsensusKey },
        { blockId: 1572, txId: 3, model: RevealPK },
        { blockId: 1672, txId: 0, model: ChangeValidatorComission },
        { blockId: 1700, txId: 2, model: ResignSteward },
        { blockId: 1714, txId: 5, model: UpdateStewardCommission },
        { blockId: 1726, txId: 2, model: ReactivateValidator },
    ];

    before(async () => {
        for (const { model } of transactions) {
            await model.sync({ force: true });
        }
    });

    for (const { blockId, txId, model } of transactions) {
        it(`should upload ${model.name} tx`, async () => {
            const { tx: { content: { data } } } = await getTransaction(blockId, txId);
            await model.create(data);
            assert((await model.count()) == 1);
        });
    }
});

async function getTransaction(blockId, txId) {
    const rangeStart = Math.floor(blockId / 1000) * 1000;
    const rangeEnd = Math.floor(blockId / 1000) * 1000 + 999;
    const URL = `https://namada.undexer.demo.hack.bg/block/${rangeStart}-${rangeEnd}/${blockId}/tx-${txId}.json`;
    const response = await fetch(URL);
    return await response.json();
}
