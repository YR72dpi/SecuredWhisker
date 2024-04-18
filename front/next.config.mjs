/** @type {import('next').NextConfig} */
import * as path from "path"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("+++ " +path.join(__dirname, 'src/app/styles'))

const nextConfig = {
    sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
      },
};

export default nextConfig;
