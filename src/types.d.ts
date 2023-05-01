import express, {Request} from 'express';
export declare type Access = 'push' | 'pull';
export interface User {
    access: Access;
    password: string;
}
export interface AuthorizationRequestQuery extends Request {
    Type: string;
    Name: string;
    Actions: string[];
    Account: string;
}