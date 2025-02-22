#!/usr/bin/env -S node --import @ganesha/esbuild
import db from '../src/db.js'
import { sql } from '../src/dbUtil.js'

await migrate()
  .catch(e=>{
    console.error(e.message)
    console.error(e.parent.hint)
    console.error(e.parent.position)
    process.exit(1)
  })
  .then(()=>{
    console.log('Migration complete.')
    process.exit(0)
  })

async function migrate () {

  await db.query(sql.unsafe`begin;
    create table if not exists public.rpc_responses (
      "id"        integer,
      "timestamp" date,
      "url"       text,
      "response"  text,
      "createdAt" timestamp with time zone not null,
      "updatedAt" timestamp with time zone not null,
      constraint rpc_responses_pkey primary key ("id")
    );
    alter table public.rpc_responses owner to postgres;
    create sequence if not exists
      public.rpc_responses_id_seq
      as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
    alter sequence
      public.rpc_responses_id_seq
      owned by public.rpc_responses.id;
    alter table only
      public.rpc_responses
      alter column id set default nextval('public.rpc_responses_id_seq'::regclass);

    create table if not exists public.block_data_responses (
      "chainId"     text not null,
      "blockHash"   text not null,
      "blockHeight" integer not null,
      "blockTime"   date,
      "blockData"   jsonb,
      constraint block_data_responses_pkey primary key ("blockHash")
    );
    alter table public.block_data_responses owner to postgres;

    create table if not exists public.block_results_responses (
      "chainId"       text not null,
      "blockHash"     text not null,
      "blockHeight"   integer not null,
      "blockTime"     date,
      "blockResults"  jsonb,
      constraint block_results_responses_pkey primary key ("blockHash")
    );
    alter table public.block_results_responses owner to postgres;

  commit;`.sql)

  console.log('Created tables')

  await db.query(sql.unsafe`begin;
    insert into public.rpc_responses ((select
      2 * nextval('public.rpc_responses_id_seq'::regclass) as "id",
      "blockTime"                         as "timestamp",
      "rpcResponses"->'block'->'url'      as "url",
      "rpcResponses"->'block'->'response' as "response",
      "createdAt" as "createdAt",
      "updatedAt" as "updatedAt"
    from blocks) union (select
      1 + 2 * nextval('public.rpc_responses_id_seq'::regclass) as "id",
      "blockTime"                           as "timestamp",
      "rpcResponses"->'results'->'url'      as "url",
      "rpcResponses"->'results'->'response' as "response",
      "createdAt" as "createdAt",
      "updatedAt" as "updatedAt"
    from blocks) order by "timestamp");
    alter table blocks drop column "rpcResponses";
  commit;`.sql)

  console.log('Migrated raw RPC responses')

  await db.query(sql.unsafe`begin;
    insert into public.block_data_responses (select
      "chainId",
      "blockHash",
      "blockHeight",
      "blockTime",
      "blockData"
    from public.blocks);
    //alter table blocks drop column "blockData";
  commit;`.sql)

  console.log('Migrated parsed block data responses')

  await db.query(sql.unsafe`begin;
    insert into public.block_result_responses (select
      "chainId",
      "blockHash",
      "blockHeight",
      "blockTime",
      "blockResults"
    from public.blocks);
    //alter table blocks drop column "blockResults";
  commit;`.sql)

  console.log('Migrated parsed block results responses')
}
