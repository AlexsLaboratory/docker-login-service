import { log } from 'console';
import fs from 'fs';
import express, {json, Express, Request, Response} from 'express';
import { resolve } from 'path';
import { generateJWT, parseRequest } from './utils';

const config = fs.readFileSync('config.yml', 'utf8');

const isProduction = process.env.NODE_ENV === 'production';

const privateKey = isProduction ? fs.readFileSync('/ssl/private.ec-256.key', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'private.ec-256.key'), 'utf8');
const publicKey = isProduction ? fs.readFileSync('/ssl/public.pem', 'utf8') : fs.readFileSync(resolve(__dirname, 'auth_certificates', 'public.pem'), 'utf8');

const app: Express = express();
app.use(json());
const port = 5001;

app.get('/token', (req: Request, res: Response) => {
    try {
        parseRequest(req);
        const token = generateJWT(req);
        res
        .status(200)
        .json({token});
    } catch (error) {
        log("Something went wrong: ", error);
        res
        .status(error.status as number)
        .json({message: error.message});
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
