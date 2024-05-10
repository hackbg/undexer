import sequelize from "../../db/index.js";
import "dotenv/config";
import fs from "fs";

const fetchJSON = (url) => {
  console.log(`Fetching ${url}`);
  return fetch(url).then((response) => response.json());
};

const { START_BLOCK, POST_UNDEXER_RPC_URL } = process.env;

async function main() {
  const blocks = [];
  const blockResponses = [];
  for (let i = 0; i < 1000; i++) {
    const currentBlockNumber = Number(START_BLOCK) + i;
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
