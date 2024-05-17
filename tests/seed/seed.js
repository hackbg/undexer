import fs from "fs";
import { POST_UNDEXER_RPC_URL, NODE_LOWEST_BLOCK_HEIGHT } from "../../constants.js";
import sequelize from "../../db/index.js";

const fetchJSON = (url) => {
  console.log(`Fetching ${url}`);
  return fetch(url).then((response) => response.json());
};

async function main() {
  const blocks = [];
  const blockResponses = [];
  for (let i = 0; i < 1000; i++) {
    const currentBlockNumber = Number(NODE_LOWEST_BLOCK_HEIGHT) + i;
    console.log(`Downloading block ${currentBlockNumber} ...`);
    const [block, blockResponse] = await Promise.all([
      fetchJSON(`${POST_UNDEXER_RPC_URL}/block?height=${currentBlockNumber}`),
      fetchJSON(
        `${POST_UNDEXER_RPC_URL}/block_results?height=${currentBlockNumber}`
      ),
    ]);
    blocks.push(block);
    blockResponses.push(blockResponse);
  }

  await fs.writeFile(`block/seed.json`, JSON.stringify(blocks));
  await fs.writeFile(
    `block_response/seed.json`,
    JSON.stringify(blockResponses)
  );
}

main();
