import e from "express";
import { getContestsPaginated } from "../controller/ContestController.js";

export const ContestRouter = e.Router();

ContestRouter.get('/get-contests',getContestsPaginated);