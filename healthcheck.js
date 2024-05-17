import { Console } from "./fadroma/packages/agent";
import { UNDEXER_API_URL } from './constants.js'

const console = new Console("Healthchecks");

const endpoints = [
  "block/latest",
  "block/1",
  "block/hash/5816E6E8157642722177233B9A7D14E2A47175A5BF3F770923E4736ECAE62168",
  "blocks",
  "validators",
  "proposal/1",
  "proposal/votes/1",
  "proposals/stats",
  "validator/uptime/7A27465351C2EAFD51B8853D38DE51D9FB6B3970",
  "validator/7A27465351C2EAFD51B8853D38DE51D9FB6B3970",
  "validators/consensus",
  "txs",
  "tx/D7F20626E603C1F185C9C6B8EC01EAA200E9F6E15002B68D7F6C63BDB3CF1E2B",
];

async function main() {
  const endpointsResponse = await Promise.all(
    endpoints.map((endpoint) => {
      return fetch(`${UNDEXER_API_URL}/${endpoint}`, { redirect: "follow" });
    })
  );
  const notWorkingEndpoints = endpointsResponse.filter((response) => response.status >= 400)

  notWorkingEndpoints.forEach(({ url, status, statusText }) => {
    console.error(url, status, statusText);
  });
  if (notWorkingEndpoints.length !== 0){
    throw new Error("Healthcheck failed"); 
  }
  console.log("Healthcheck passed");
}

main();
