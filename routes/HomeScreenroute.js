import e from "express";
import { HomeScreenFeed } from "../controller/HomeScreenController.js";

export const HomeRouter  = e.Router();

HomeRouter.get('/feed',HomeScreenFeed)

