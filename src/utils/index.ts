import express, { Request } from 'express';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import fs from 'fs';
import { resolve } from 'path';
import { Access, Actions, User } from '../types';
import { parse, stringify } from 'yaml';
import { HttpError } from '../classes';
import { Hash, Sign, createHash, randomUUID } from 'crypto';
import { encode } from 'base32-transposer';
import { log } from 'console';

const isProduction = process.env.NODE_ENV === 'production';

const privateKey = isProduction ? fs.readFileSync('/ssl/private.ec-256.key', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'private.ec-256.key'), 'utf8');
const publicKey = isProduction ? fs.readFileSync('/ssl/public.pem', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'public.pem'), 'utf8');
const config = fs.readFileSync('config.yml', 'utf8');
const parseConfig = parse(config);

const { users } = parseConfig;

export function parseRequest(req: Request): Request {
    const { scope, service } = req.query as { scope: string, service: string };
    req.Service = service;
    const parts = scope.split(':') as string[];
    if (parts.length > 0) {
        req.Type = parts[0]
    }
    if (parts.length > 1) {
        req.Name = parts[1]
    }
    if (parts.length > 2) {
        req.Actions = parts[2].split(",") as Actions[]
    }
    if (req.Account == "") {
        req.Account = req.Name
    }
    return req;
}

function generateKidSha256(): Hash {
    const publicKeyBuffer = Buffer.from(publicKey);
    return createHash('sha256').update(publicKeyBuffer);
}

function generateKid(): string {
    const hash = generateKidSha256();
    const hashBuffer = hash.digest();
    const base32Kid = encode(hashBuffer);
    const base32KidArray = [...base32Kid];
    let kid240 = '';
    for (const [index, value] of base32KidArray.entries()) {
        const bitCount = (index + 1) * 5;
        const bitCountMod = bitCount % 4;
        kid240 += base32KidArray[index];
        if (bitCountMod === 0) kid240 += ':';
        if (bitCount === 240) break;
    }
    if (kid240.endsWith(':')) kid240 = kid240.slice(0, -1);
    return kid240;
}

export function generateJWT(req: Request): string | HttpError {
    const kid = generateKid();
    const signOptions: SignOptions = {
        expiresIn: '12h',
        issuer: parseConfig.auth.token.issuer,
        audience: parseConfig.auth.token.service,
        notBefore: '0s',
        jwtid: randomUUID().replace(/-/g, ''),
        header: {
            typ: 'JWT',
            alg: 'ES256',
            kid
        }
    };
    const { authorization } = req.headers;
    if (!authorization) throw new HttpError('UNAUTHORIZED', 401);
    const [username, password] = Buffer.from(authorization.split(' ')[1], 'base64').toString().split(':');
    const user = users[username] as User;
    if (!user) throw new HttpError('UNAUTHORIZED', 401);
    const access: Array<Access> = [
        { type: req.Type, name: req.Name, actions: req.Actions },
    ];
    const payload = {
        access,
    }
    if (user.password !== password) throw new HttpError('UNAUTHORIZED', 401);
    return sign(payload, privateKey, signOptions);
}
