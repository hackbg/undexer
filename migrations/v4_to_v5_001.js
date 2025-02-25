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
      "createdAt" timestamp with time zone,
      "updatedAt" timestamp with time zone,
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
}
