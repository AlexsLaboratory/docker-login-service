import { log } from 'console';
import { parse, stringify } from 'yaml';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import { Access, User} from './types';
import fs from 'fs';
import express, {json, Express, Request, Response} from 'express';
import { resolve } from 'path';
import { generateJWT } from './utils';
import { HttpError } from './classes';

const config = fs.readFileSync('config.yml', 'utf8');
const parseConfig = parse(config);

const { users } = parseConfig;

const signOptions: SignOptions = {
    algorithm: 'RS256',
    expiresIn: '12h',
    issuer: parseConfig.auth.token.issuer,
    audience: parseConfig.auth.token.service
};

const isProduction = process.env.NODE_ENV === 'production';

const privateKey = isProduction ? fs.readFileSync('/ssl/server.key', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'server.key'), 'utf8');
const publicKey = isProduction ? fs.readFileSync('/ssl/server.pem', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'server.pem'), 'utf8');

const app: Express = express();
app.use(json());
const port = 5001;

app.get('/token', (req: Request, res: Response) => {
    try {
        const token = generateJWT(req);
        res
        .status(200)
        .json({token});
    } catch (error) {
        res
        .status(error.status as number)
        .json({message: error.message});
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});