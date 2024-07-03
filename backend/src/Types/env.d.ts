declare global {
    namespace NodeJS {
        interface ProcessEnv {
            API_JWT_TOKEN: string;           
            DB_AUTH: string;
        }
    }
}

export { };