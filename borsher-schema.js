export const ValidatorSchema = {
    set: {
        array: {
            type: "u8",
            len: 21,
        },
    },
};
export const StakeSchema = "u64";

export const ProposalSchema = {
    struct: {
        id: "string",
        proposalType: "string",
        author: "string",
        startEpoch: "u64",
        endEpoch: "u64",
        graceEpoch: "u64",
        contentJSON: "string",
        status: "string",
        result: "string",
        totalVotingPower: "string",
        totalYayPower: "string",
        totalNayPower: "string",
    },
};

export const ProposalsSchema = {
    array: {
        type: ProposalSchema,
    },
};

