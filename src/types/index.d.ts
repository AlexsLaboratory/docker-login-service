export declare type Actions = 'push' | 'pull';
export interface Access {
    type: string;
    name: string;
    actions: Actions[];
}
export interface User {
    username: string;
    password: string;
}
declare global {
    namespace Express {
        interface Request {
            Type?: string;
            Name?: string;
            Actions?: Actions[];
            Account?: string;
            Service?: string;
        }
    }
}
