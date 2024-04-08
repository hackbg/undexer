import { save } from './utils.js';
import { mkdirSync, readFile, readFileSync } from 'node:fs';
import 'dotenv/config';

if (process.env.UNDEXER_DATA_DIR) {
  await mkdirSync(process.env.UNDEXER_DATA_DIR + '/validators', {
    recursive: true,
  });
  process.chdir(process.env.UNDEXER_DATA_DIR + '/validators/');
} else {
  throw new Error('set UNDEXER_DATA_DIR');
}

let allValidators = JSON.parse(readFileSync('all_validators.json'));
let belowThreshold = [];
let belowCapacity = [];
let jailed = [];
let inactive = [];
let consensus = [];

for (let i = 0; i < allValidators.length; i++) {
    
  const validator = JSON.parse(readFileSync(`${allValidators[i]}.json`));
  const validatorInfo = {
    address: validator.validator,
    stake: validator.stake,
    state: validator.state,
    commission: validator.commission,
  };

  if (validator.state === 'BelowThreshold') {
    belowThreshold.push(validatorInfo);
  } else if (validator.state === 'Jailed') {
    jailed.push(validatorInfo);
  } else if (validator.state === 'Inactive') {
    inactive.push(validatorInfo);
  } else if (validator.state === 'BelowCapacity') {
    belowCapacity.push(validatorInfo);
  } else if (validator.state === 'Consensus') {
    consensus.push(validatorInfo);
  } else {
    console.log('Unknown state:', validator.state);
  }
}

await save(`validators_consensus.json`, consensus);
await save(`validators_jailed.json`, jailed);
await save(`validators_below_capacity.json`, belowCapacity);
await save(`validators_below_threshold.json`, belowThreshold);
await save(`validators_inactive.json`, inactive);

console.log(`Done`);
