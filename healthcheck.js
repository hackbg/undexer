import "dotenv/config";
import { Console } from "./fadroma/packages/agent";

const console = new Console("Healthchecks");

const endpoints = [
  "/block/latest",
  "/block/1",
  "/block/hash/5816E6E8157642722177233B9A7D14E2A47175A5BF3F770923E4736ECAE62168",
  "/blocks",
  "/validators",
];

const { UNDEXER_API_URL } = process.env;

async function main() {
  const endpointsResponse = await Promise.all(
    endpoints.map((endpoint) => {
      return fetch(`${UNDEXER_API_URL}/${endpoint}`, { redirect: "follow" });
    })
  );
  const notWorkingEndpoints = endpointsResponse.filter(
    (response) => response.status >= 200 || response.status < 400
  );

  if (notWorkingEndpoints.length > 0) {
    endpointsResponse.forEach(({ url, status, statusText }) => {
      console.log(url, status, statusText);
    });
  } else {
    throw new Error("Endpoints are not working");
  }
  // const response = await fetch(`${TX_URL}`).get("/health");
}

main();
