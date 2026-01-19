import express from 'express'
import { FetchCategory,  FetchSelectedSubCategories } from '../controller/CategoryController.js';

export const CategoryRoute = express.Router();

CategoryRoute.get('/fetch-parent-categories' , FetchCategory);
CategoryRoute.get('/fetch-perticular-categories' , FetchSelectedSubCategories);
