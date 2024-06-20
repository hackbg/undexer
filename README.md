# Undexer

This is the Undexer. It decodes historical data from a [Namada](https://namada.net/)
node, and caches it into PostgreSQL, so that you don't have to.

Undexer is the pilot project for [Fadroma 2.0](https://github.com/hackbg/fadroma/).
See [`@fadroma/namada`](https://github.com/hackbg/fadroma/tree/v2/packages/namada)
and [`@hackbg/borshest`](https://github.com/hackbg/toolbox/tree/main/borshest).

## API Reference and Endpoints

### API v2 (current): https://v2.namada.undexer.demo.hack.bg/

| Method                                                                                                | Result                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET /v2/block/latest                                                                                  | The height of the latest block                                                                                                                                                                                                                                                                                                                                |
| GET /v2/blocks?limit= _&before=_                                                                      | Paginated list of blocks, icluding the transaction ids for every block, sorted by height in descending order and the count of all blocks.                                                                                                                                                                                                                     |
| GET /v2/block/:height                                                                                 | The block on the corresponding height, including transactions information for the block                                                                                                                                                                                                                                                                       |
| GET /v2/block/hash/:hash                                                                              | The block with the corresponding hash, including transactions information for the block                                                                                                                                                                                                                                                                       |
| | |
| GET /v2/txs?limit=_&offset=_                                                                         | Paginated list of transactions sorted by date and the count of all transactions                                                                                                                                                                                                                                                                               |
| GET /v2/tx/:txHash                                                                                    | The transaction with corresponding hash                                                                                                                                                                                                                                                                                                                       |
| | |
| GET /v2/validators?limit=_ &offset=_                                                                  | Paginated list of validators sorted by stake in descending order and the count of all validators.                                                                                                                                                                                                                                                             |
| GET /v2/validators/:state?limit= _&offset=_                                                           | Paginated list of the validators with the corresponding state, sorted by stake in descending order and the count of all validators. Valid states: `BelowThreshold`, `BelowCapacity`, `Jailed`, `Consensus`, `Inactive`                                                                                                                                        |
| GET /v2/validator/:hash                                                                               | The validator with corresponding hash.                                                                                                                                                                                                                                                                                                                        |
| GET /v2/validator/uptime/:address                                                                     | Returns `currentHeight` - latest block hight, `countedBlocks` - the amount of blocks that are checked (default 100), `uptime` - the amount of blocks in `countedBlocks` signed by the given validator                                                                                                                                                         |
| | |
| GET /v2/proposals?limit=_ &offset=_ &orderBy=_ &orderDirection=_ &proposalType=_ &status=_ &result=\_ | Paginated list of proposals and the count of all proposals. The results can be sorted and filtered with the queries: `orderBy: 'id' \| 'status' \| 'result' \| 'proposalType'` `orderDirection: 'ASC' \| 'DESC'` `proposalType: 'pgf_steward' \| 'pgf_payment' \| 'default'` `status: 'upcoming' \| 'ongoing' \| 'finished'` `result: 'passed' \| 'rejected'` |
| GET /v2/proposals/stats                                                                               | The count of proposals by status, result and total count of all proposals                                                                                                                                                                                                                                                                                     |
| GET /v2/proposal/:id                                                                                  | Governance proposal information by id                                                                                                                                                                                                                                                                                                                         |
| GET /v2/proposal/votes/:proposalId                                                                    | Get all votes by proposal id                                                                                                                                                                                                                                                                                                                                  |

### API v1 (deprecated): https://namada.undexer.demo.hack.bg/

We currently provide hosted infrastructure of the v1 version of

| Method                                          | Description                                         |
| ----------------------------------------------- | --------------------------------------------------- |
| GET /block/index.json                           | summary of last block and pagination options        |
| GET /block/:page/:height/block.json             | block information                                   |
| GET /block/:page/:height/tx-{:txIndex}.json     | decoded transactions in the specified block         |
|                                                 |                                                     |
| GET /validators/all_validators.json             | all validators information                          |
| GET /validators/validators_jailed.json          | list validators with status jailed                  |
| GET /validators/validators_below_capacity.json  | list validators below capacity                      |
| GET /validators/validators_below_threshold.json | list validators below threshold                     |
| GET /validators/validators_consensus.json       | list validators in consensus                        |
| GET /validators/validators_inactive.json        | list validators with status inactive                |
| GET /validators/{:validatorAddress}.json        | validator information by address                    |
|                                                 |                                                     |
| GET /proposals/all_proposals.json               | list all governance proposals summary               |
| GET /proposals/{:proposalId}.json               | proposal information by id                          |
| GET /voters/{:proposalId}.json                  | list voters with vote type and weights by proposalId|

## Development guidelines

The quickest way to deploy the whole stack locally
(PostgreSQL, PGAdmin, indexer, and API):

```bash
docker compose up -d
docker compose logs -f
```

By default, the API server will listen on `http://localhost:8888`.

> **Note:** You can set `SERVER_PORT` to listen on another port.

> **Note:** `.env` files are supported.

To just launch PostgreSQL and PGAdmin services in Docker, and
work on indexer/API locally (outside of container):

```bash
docker compose up -d postgres pgadmin
npm start
```

This launches the `api` and `indexer` services using [`concurrently`](https://www.npmjs.com/package/concurrently),
and listens on `http://localhost:8888`.

### Compiling the WASM modules

The indexer service depends the WASM blob provided by `@fadroma/namada`.
It lives in `./fadroma/packages/namada/fadroma_namada_bg.wasm`.
It's a binary artifact, so it's not included in the Git repo.
To generate it:

```bash
cd fadroma/packages/namada && npm run build:wasm:dev
```

`./fadroma` is a Git submodule. Handle accordingly. For example, if the directory is empty,
this usually means you cloned the Undexer repo without submodules. To populate it, use:

```bash
git submodule update --init --recursive
```

### Troubleshooting

If you catch anything breaking, debug accordingly
and/or file an issue/PR in this repository.

### Production deployment

Undexer does not manage TLS certificates or terminate HTTPS.
In production, it's recommended to run behind NGINX with ACME/LetsEncrypt
or your own certificates.
