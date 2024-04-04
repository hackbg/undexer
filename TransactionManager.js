import Cipher from "./models/Sections/Cipher";
import Code from "./models/Sections/Code";
import Data from "./models/Sections/Data";
import ExtraData from "./models/Sections/ExtraData";
import MaspBuilder from "./models/Sections/MaspBuilder";
import Signature from "./models/Sections/Signature";
import Transaction from "./models/Transaction";
import { SectionTypeToModel, format } from "./utils";

export default class TransactionManager {
    static async handleTransaction(tx, eventEmitter) {
        try {
            const uploadData = format(Object.assign(tx.content));
            await SectionTypeToModel[tx.content.type].create(uploadData.data);

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
            await TransactionManager.sideEffects(tx, eventEmitter)
        } catch (e) {
            console.error(e);
        }
    }

    static async sideEffects(tx, eventEmitter) {
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
            eventEmitter.emit("updateValidators");
        }

        if(tx.content.type === "tx_vote_proposal.wasm") {
            console.log(tx);
        }
    }
}
