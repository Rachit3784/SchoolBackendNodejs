import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    SubCategoryName : {
        type : String ,
        required : true
    },
    SubCategoryCoverImage : {
        type : String ,
        required : true
    },
    ParentCategoryId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'ParentCategory',
        required : true
    }
})

export const CategoryModel = mongoose.model('Category',CategorySchema);