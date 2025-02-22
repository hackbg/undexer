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
    create table if not exists public.block_results_responses (
      "chainId"      text not null,
      "blockHash"    text not null,
      "blockHeight"  integer not null,
      "blockTime"    date,
      "blockResults" jsonb,
      constraint block_results_responses_pkey primary key ("blockHash")
    );
    alter table public.block_results_responses owner to postgres;
    insert into public.block_results_responses (select
      "chainId",
      "blockHash",
      "blockHeight",
      "blockTime",
      "blockResults"
    from public.blocks);
    alter table blocks drop column "blockResults";
  commit;`.sql)
  console.log('Migrated parsed block results responses')
}
