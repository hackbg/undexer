import SequelizeInstance from 'db/index.js';

export default async function main () {
    return await SequelizeInstance.test();
}

main();