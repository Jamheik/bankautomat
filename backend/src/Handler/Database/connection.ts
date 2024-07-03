import { sleep } from '../../Utils/sleep';
import sql, { ConnectionPool } from 'mssql';

export let pool: ConnectionPool;
export let isServerConnected = false;
export let dbVersion = '';

export async function waitForConnection() {
    while (!isServerConnected) {
        await sleep(0);
    }
}

const activeConnections: Record<string, any> = {}; 

export async function createConnectionPool() {
    try {
        pool = await new sql.ConnectionPool(process.env.DB_AUTH).connect();

        pool.on('error', err => {
            console.error(err);
        });

        console.log('Database server connection established!');
        isServerConnected = true;

        const request = pool.request();
        const result = await request.query('SELECT @@VERSION as version');

        if (result.recordset.length > 0) {
            dbVersion = `[${result.recordset[0].version}]`;
        }

        console.log(`${dbVersion} Database server connection established!`);
    } catch (err: any) {
        isServerConnected = false;

        console.error(
            `Unable to establish a connection to the database (${err.code})!\nError ${err.errno}: ${err.message}`
        );
    }
}

export async function getPoolConnection(id?: string) {
    if (!isServerConnected) await waitForConnection();

    return id ? activeConnections[id] : pool.request();
}
