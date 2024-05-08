import { mkdirSync } from "fs";
import fs from "fs/promises";
import "dotenv/config";

mkdirSync("tests/seed/data", { recursive: true });
mkdirSync("tests/seed/data/block", { recursive: true });
mkdirSync("tests/seed/data/block_response", { recursive: true });
process.chdir("tests/seed/data");

const fetchText = (url) => {
  console.log(`Fetching ${url}`);
  return fetch(url).then((response) => response.text());
};

const { START_BLOCK, POST_UNDEXER_RPC_URL } = process.env;
async function main() {
  for (let i = 0; i < 1000; i++) {
    const currentBlockNumber = Number(START_BLOCK) + i;
    console.log(`Downloading block ${currentBlockNumber} ...`);
    const [block, blockResponse] = await Promise.all([
      fetchText(`${POST_UNDEXER_RPC_URL}/block?height=${currentBlockNumber}`),
      fetchText(
        `${POST_UNDEXER_RPC_URL}/block_results?height=${currentBlockNumber}`
      ),
    ]);

    await fs.writeFile(`block/${currentBlockNumber}.json`, block);
    await fs.writeFile(
      `block_response/${currentBlockNumber}.json`,
      blockResponse
    );
  }
}

main();
