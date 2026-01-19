import e from "express";
import { getAllStore, getNearByStores } from "../controller/FetchingOrganisationService.js";

export const FetchingStoreRouter = e();

FetchingStoreRouter.get('/near-stores' , getNearByStores)
FetchingStoreRouter.get('/all-stores' , getAllStore)