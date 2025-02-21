#!/usr/bin/env -S node --import @ganesha/esbuild
import db from '../src/db.js'
import { sql } from '../src/dbUtil.js'

const query = sql.unsafe`begin;

  create table public.rpc_responses (
    "id"        integer,
    "timestamp" date,
    "url"       text,
    "response"  text,
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null
  );

  alter table public.rpc_responses
    owner to postgres;

  alter table public.rpc_responses
    add primary key ("id");

  create sequence public.rpc_responses_id_seq
    as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;

  alter sequence public.rpc_responses_id_seq
    owner to postgres;

  alter sequence public.rpc_responses_id_seq
    owned by public.rpc_responses.id;

  alter table only public.rpc_responses
    alter column id
      set default nextval('public.rpc_responses_id_seq'::regclass);

  insert into rpc_responses (select
    nextval('public.rpc_responses_id_seq'::regclass) * 2 as "id",
    "blockTime"                         as "timestamp",
    "rpcResponses"->'block'->'url'      as "url",
    "rpcResponses"->'block'->'response' as "response",
    "createdAt" as "createdAt",
    "updatedAt" as "updatedAt"
  from blocks);

  insert into rpc_responses (select
    1 + nextval('public.rpc_responses_id_seq'::regclass) * 2 as "id",
    "blockTime"                           as "timestamp",
    "rpcResponses"->'results'->'url'      as "url",
    "rpcResponses"->'results'->'response' as "response",
    "createdAt" as "createdAt",
    "updatedAt" as "updatedAt"
  from blocks);

  alter table blocks drop column "rpcResponses";

commit;`

await db.query(query.sql)
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
