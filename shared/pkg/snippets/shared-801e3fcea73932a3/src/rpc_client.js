/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Small wrapper for fetch to make it easier to pass props
 * Called wasmFetch to avoid naming conflict
 */
export const wasmFetch = async (url, method, body) => {
  const res = await fetch(url, {
    method,
    body,
  });
  return res;
}

// module.exports = { wasmFetch };
