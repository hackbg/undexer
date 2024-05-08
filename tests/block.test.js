import { describe, it, before } from "node:test";
import fs from "fs";
import * as Namada from "@fadroma/namada";
import "dotenv/config";

const { POST_UNDEXER_RPC_URL } = process.env;

describe("block", async () => {
  const conn = Namada.testnet({
    url: POST_UNDEXER_RPC_URL,
  });

  console.log(POST_UNDEXER_RPC_URL);
  it("should decode all blocks", async () => {
    const blockFileNames = fs.readdirSync("tests/seed/data/block");
    for (const blockHeight of blockFileNames) {
      /*const block = fs.readFileSync(
        `tests/seed/data/block/${blockHeight}`,
        "utf-8"
      );

      const response = fs.readFileSync(
        `tests/seed/data/block_response/${blockHeight}`,
        "utf-8"
      );*/
      const [block, response] = await Promise.all([
        fetch(`${POST_UNDEXER_RPC_URL}/block?height=237910`).then((response) =>
          response.text()
        ),
        fetch(`${POST_UNDEXER_RPC_URL}/block_results?height=237910`).then(
          (response) => response.text()
        ),
      ]);

      console.log({ block, response });
      const decodedResult = await conn.decode.block(block, response);

      //console.log(result);
    }
  });
});
