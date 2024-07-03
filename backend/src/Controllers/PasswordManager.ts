import bcrypt from 'bcrypt';

export class PasswordManager {

    private readonly passwordString: string;
    private readonly saltRounds: number = 10;

    constructor(passwordString?: string) {
        if (passwordString) {
            this.passwordString = passwordString;
        }
    }

    public async hashPasswordString(): Promise<string | undefined> {
        const passString = this.passwordString;

        return bcrypt.hash(passString, this.saltRounds).then(function (hash) {
            return hash;
        }).catch(error => {
            console.error(error);
            return undefined;
        })
    }

    public async comparePasswordHash(hash: string): Promise<boolean> {
        const match = await bcrypt.compare(this.passwordString, hash);
        return match;
    }
}



