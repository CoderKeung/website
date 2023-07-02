import Express from "express";
import Routes from "./routes/index.js"
import Cors from "cors"
import Path from "path"
import { __dirname } from "./config.js";

const app = Express()

app.use(Cors())
app.use(Express.static(Path.join(__dirname, "../../docxs")))

app.use(Express.urlencoded({
  extended: true
}))
app.use(Express.json());

app.use(Routes)

app.listen(8080, ()=>{
  console.log("OK")
})