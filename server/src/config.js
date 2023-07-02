import Path from "path"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = Path.dirname(__filename);
export const STYLEPATH = Path.join(__dirname, "assets/styles.xml")
export const DOCXSDIR = Path.join(__dirname, "../../docxs/")