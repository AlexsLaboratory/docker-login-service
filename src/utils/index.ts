import express, {Request} from 'express';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import fs from 'fs';
import { resolve } from 'path';
import { Access, AuthorizationRequestQuery, User} from '../types';
import { parse, stringify } from 'yaml';
import { HttpError } from '../classes';
import { log } from 'console';

const isProduction = process.env.NODE_ENV === 'production';

const privateKey = isProduction ? fs.readFileSync('/ssl/server.key', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'server.key'), 'utf8');
const publicKey = isProduction ? fs.readFileSync('/ssl/server.pem', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'server.pem'), 'utf8');
const config = fs.readFileSync('config.yml', 'utf8');
const parseConfig = parse(config);

const { users } = parseConfig;

export function parseRequest(req: AuthorizationRequestQuery): AuthorizationRequestQuery {
    const {scope, service} = req.query as {scope: string, service: string};
    req.Service = service;
    const parts = scope.split(':') as string[];
    if (parts.length > 0) {
		req.Type = parts[0]
	}
	if (parts.length > 1) {
		req.Name = parts[1]
	}
	if (parts.length > 2) {
		req.Actions = parts[2].split(",")
	}
	if (req.Account == "") {
		req.Account = req.Name
	}
	return req;
}
    
export function generateJWT(req: Request): string | HttpError {
    const signOptions: SignOptions = {
        algorithm: 'RS256',
        expiresIn: '12h',
        issuer: parseConfig.auth.token.issuer,
        audience: parseConfig.auth.token.service
    };
    const { authorization } = req.headers;
    if (!authorization) throw new HttpError('UNAUTHORIZED', 401);
    const [username, password] = Buffer.from(authorization.split(' ')[1], 'base64').toString().split(':');
    const user = users[username] as User;
    if (!user) throw new HttpError('UNAUTHORIZED', 401);
    const payload = {
        name: username,
        admin: true
    };
    if (user.password !== password) throw new HttpError('UNAUTHORIZED', 401);
    return sign(payload, privateKey, signOptions);
}
