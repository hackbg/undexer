# Undexer

## Overview
The Undexer is a caching and reporting layer which sits in front of the nodes of the Namada network. Its purpose is to respond to queries faster than the node can do, and to support queries that for reasons of efficiency the node cannot or will not support itself.

The architecture of the app is explained here.

## Architecture

### Goals
- Versioned API: Implement a versioning strategy for the API to ensure backward compatibility and allow for future updates without breaking existing integrations. This helps to manage changes and provide a stable interface for clients.
- Rapid Sync Speed: Optimize the sync process to achieve faster data synchronization. This can involve improving algorithms, utilizing parallel processing, optimizing database queries, or implementing efficient caching mechanisms. By reducing sync times, you can provide real-time or near real-time data updates to users.
- Lean, Fast, and Easy Development and Deployment: Focus on improving the undexer's performance, reducing resource consumption, and enhancing its development and deployment process. Employ efficient coding practices, utilize lightweight frameworks, and automate deployment pipelines to streamline development and ensure faster, hassle-free deployments.
- Reliable Paginated Retrieval: Enhance the API endpoints to support reliable paginated retrieval of information. Implement mechanisms such as cursor-based pagination or offset-based pagination to allow clients to retrieve data in manageable chunks, improving performance and preventing overwhelming large result sets.
- Complex Search Queries: Enable the ability to perform complex search queries across multiple endpoints. Implement advanced search capabilities, such as filtering, sorting, and aggregations, to empower users to retrieve specific and relevant information from the undexer. This can be achieved by integrating powerful search engines or implementing custom search functionalities.

Implementation keeping these goals in mind should result in a undexer usable as a data source for the frontend, as well as a generic service component in any other setup working with Namada network.

### Design
The design decision with the greatest impact was laying support for Namada in Fadroma (@fadroma/namada).

The extension of this decision is running a custom WASM precompile with the undexer logic when targeting complex data retrieval via RPC queries (non-existent on the base Tendermint ABCI endpoints or the official SDKs e.g. namada-shared, light-sdk).

The benefits of these decisions were:

- Richer data availability
- Easier integration between backends and frontents
- Much simpler and cheaper flow of data
- Significant speedup in syncing
- Greater stability
- Easier deployment and upgrading

## Main components
Undexer could be understood as an application running alongside of Namada node.

Image below depicts how these two large blocks fit together.

// TODO: Image of architecture

## Docker setup for local dev

Use the `docker-compose.yml` to run the undexer as is.

## Hosted Infrastructure
We currently provide hosted infrastructure of the v1 version of Undexer at https://namada.undexer.demo.hack.bg/.

NOTE: Local deploy with default configuration endpoints will run on localhost:8888.

## [WIP] HTTP v2 (latest) endpoints
The routes and respective responses are:
```
GET  /v2/block/:height                     - block information by height
GET  /v2/block/hash/:hash                  - block information by hash
GET  /v2/block/latest                      - latest block information
GET  /v2/blocks/?limit=_&offset=_          - get blocks by specifying pagination

GET  /v2/tx/:txHash                        - transaction information by hash

GET  /v2/validators                        - all validators
GET  /v2/validator/:type                   - validator information by type

GET  /v2/proposals                         - governance proposals
GET  /v2/proposal/:id                      - governance proposal by id
```

## HTTP v1 (DEPRECATED) endpoints
```
GET  /block/index.json                            - summary of last block and pagination options
GET  /block/:page/:height/block.json              - block information
GET  /block/:page/:height/tx-{:txIndex}.json      - decoded transactions in the specified block

GET  /validators/all_validators.json              - all validators information
GET  /validators/validators_jailed.json           - list validators with status jailed
GET  /validators/validators_below_capacity.json   - list validators below capacity
GET  /validators/validators_below_threshold.json  - list validators below threshold
GET  /validators/validators_consensus.json        - list validators in consensus
GET  /validators/validators_inactive.json         - list validators with status inactive
GET  /validators/{:validatorAddress}.json         - validator information by address

GET  /proposals/all_proposals.json                - list all governance proposals summary
GET  /proposals/{:proposalId}.json                - proposal information by id
GET  /voters/{:proposalId}.json                   - list voters with vote type and weights by proposalId
```

## OpenAPI specs
The swagger specification of the endpoints can be downloaded from:

// TODO

It can be visualized on a swagger UI at:

// TODO

This npm package can be also used for a self-hosted app to visualize these specs: https://www.npmjs.com/package/swagger-ui