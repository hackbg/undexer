#!/usr/bin/env -S node --import @ganesha/esbuild
import db from '../src/db.js'
import { sql } from '../src/dbUtils.js'

const query = sql`
  create table public.rpc_responses (
    "id"        integer,
    "timestamp" date,
    "url"       text not null,
    "response"  text,
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null,
  );

  alter table public.rpc_responses owner to postgres;

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
    "blockTime"                         as "timestamp",
    "rpcResponses"->'block'->'url'      as "url",
    "rpcResponses"->'block'->'response' as "response",
    "createdAt",
    "updatedAt",
  from blocks);

  insert into rpc_responses (select
    "blockTime"                           as "timestamp",
    "rpcResponses"->'results'->'url'      as "url",
    "rpcResponses"->'results'->'response' as "response",
    "createdAt",
    "updatedAt",
  from blocks);

  alter table blocks drop column "rpcResponses";
`
