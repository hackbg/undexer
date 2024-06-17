# Undexer: Architectural overview

The Undexer is a caching and reporting layer which sits in front of the nodes of the Namada network.
Its purpose is to respond to queries faster than the node can do, and to support queries that for
reasons of efficiency the node cannot or will not support itself.

## Goals

- **Versioned API**: Implement a versioning strategy for the API to ensure backward compatibility
  and allow for future updates without breaking existing integrations. This helps to manage changes
  and provide a stable interface for clients.
- **Rapid Sync Speed**: Optimize the sync process to achieve faster data synchronization. This can
  involve improving algorithms, utilizing parallel processing, optimizing database queries, or
  implementing efficient caching mechanisms. By reducing sync times, you can provide real-time or
  near real-time data updates to users.
- **Lean, Fast, and Easy Development and Deployment**: Focus on improving the undexer's performance,
  reducing resource consumption, and enhancing its development and deployment process. Employ
  efficient coding practices, utilize lightweight frameworks, and automate deployment pipelines to
  streamline development and ensure faster, hassle-free deployments.
- **Reliable Paginated Retrieval**: Enhance the API endpoints to support reliable paginated
  retrieval of information. Implement mechanisms such as cursor-based pagination or offset-based
  pagination to allow clients to retrieve data in manageable chunks, improving performance and
  preventing overwhelming large result sets.
- **Complex Search Queries**: Enable the ability to perform complex search queries across multiple
  endpoints. Implement advanced search capabilities, such as filtering, sorting, and aggregations,
  to empower users to retrieve specific and relevant information from the undexer. This can be
  achieved by integrating powerful search engines or implementing custom search functionalities.

Implementation keeping these goals in mind should result in a undexer usable as a data source for
the frontend, as well as a generic service component in any other setup working with Namada network.

## Design

The design decision with the greatest impact was adding support for Namada to
[Fadroma](https://fadroma.tech), our FOSS cross-chain toolkit. Decoding of binary data in
[the `@fadroma/namada` package](https://www.npmjs.com/package/@fadroma/namada) is achieved
using [a custom Rust/WASM module](https://github.com/hackbg/fadroma/tree/v2/packages/namada/src),
and supplemented by [`@hackbg/borshest`](https://github.com/hackbg/toolbox/tree/main/borshest),
our enhanced Borsh decoding library.

The extension of this decision is running a custom WASM precompile with the undexer logic when
targeting complex data retrieval via RPC queries (non-existent on the base Tendermint ABCI
endpoints or the official SDKs e.g. namada-shared, light-sdk).

The benefits of these decisions were:

- Richer data availability
- Easier integration between backends and frontents
- Much simpler and cheaper flow of data
- Significant speedup in syncing
- Greater stability
- Easier deployment and upgrading
