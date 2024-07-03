import { sleep } from '../../Utils/sleep';
import { createConnectionPool, isServerConnected } from './connection';

setTimeout(async () => {
    while (!isServerConnected) {
        await createConnectionPool();

        if (!isServerConnected) await sleep(30000);
    }
});

export * from './connection';