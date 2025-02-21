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
    alter table blocks drop column "rpcResponses";
    alter table blocks drop column "blockData";
    alter table blocks drop column "blockResults";
  commit;`)

  console.log('Removed old columns.')
}
