import express, {Request} from 'express';
import {SignOptions} from 'jsonwebtoken';
export declare type Access = 'push' | 'pull';
export interface User {
    access: Access;
    password: string;
}
export interface AuthorizationRequestQuery extends Request {
    Type?: string;
    Name?: string;
    Actions?: string[];
    Account?: string;
    Service?: string;
}

export interface CustomSignOptions extends SignOptions {
    kid: string;
}
