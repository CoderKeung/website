import { Router } from "express";
import {Conversion} from "../controllers/Article.js"

const Routes = Router();

Routes
  .post("/conversion", Conversion)

export default Routes
