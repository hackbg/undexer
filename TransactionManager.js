import Cipher from "./models/Sections/Cipher.js";
import Code from "./models/Sections/Code.js";
import Data from "./models/Sections/Data.js";
import ExtraData from "./models/Sections/ExtraData.js";
import MaspBuilder from "./models/Sections/MaspBuilder.js";
import Signature from "./models/Sections/Signature.js";
import Transaction from "./models/Transaction.js";
import { WASM_TO_CONTENT } from './models/Contents/index.js';
import { format } from "./utils.js";

export default class TransactionManager {
    static async handleTransaction(blockHeight, tx, eventEmitter) {
        try {
            if (tx.content !== undefined) {
                const uploadData = format(Object.assign(tx.content));
                await WASM_TO_CONTENT[tx.content.type].create(uploadData.data);
                await TransactionManager.sideEffects(blockHeight, tx, eventEmitter);
            }
            const { sections } = tx;
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                if (section.type == "ExtraData") {
                    await ExtraData.create(section);
                }
                if (section.type == "Code") {
                    await Code.create(section);
                }
                if (section.type == "Data") {
                    await Data.create(section);
                }
                if (section.type == "Signature") {
                    await Signature.create(section);
                }
                if (section.type == "MaspBuilder") {
                    await MaspBuilder.create(section);
                }
                if (section.type == "Cipher") {
                    await Cipher.create(section);
                }
                if (section.type == "MaspBuilder") {
                    await MaspBuilder.create(section);
                }
            }
            await Transaction.create(tx);
        } catch (e) {
            console.error(e);
        }
    }

    static async sideEffects(blockHeight, tx, eventEmitter) {

        if (
            tx.content.type === "tx_become_validator.wasm" ||
            tx.content.type === "tx_change_validator_commission.wasm" ||
            tx.content.type === "tx_change_validator_metadata.wasm" ||
            tx.content.type === "tx_deactivate_validator.wasm" ||
            tx.content.type === "tx_activate_validator.wasm" ||
            tx.content.type === "tx_remove_validator.wasm" ||
            tx.content.type === "tx_add_validator.wasm" ||
            tx.content.type === "tx_change_validator_power.wasm" ||
            tx.content.type === "tx_change_validator_commission.wasm" ||
            tx.content.type === "tx_deactivate_validator.wasm" ||
            tx.content.type === "tx_reactivate_validator.wasm" ||
            tx.content.type == "tx_unjail_validator.wasm" ||
            tx.content.type === "tx_bond.wasm"
        ) {
            eventEmitter.emit("updateValidators", blockHeight);
        }

        if (tx.content.type === "tx_vote_proposal.wasm") {
            eventEmitter.emit(
                "updateProposal",
                tx.content.data.proposalId,
                blockHeight
            );
        }

        if (tx.content.type === "tx_init_proposal.wasm") {
            eventEmitter.emit("createProposal", tx.content.data);
        }

    }
}
