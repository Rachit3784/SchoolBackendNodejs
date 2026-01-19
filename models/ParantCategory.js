import mongoose from "mongoose";

const ParentCategorySchema = new mongoose.Schema({
     CategoryName : {
        type : String ,
        required : true
    },
    CategoryCoverImage : {
        type : String ,
        required : true
    },
    CategoryTitle : {
        type : String ,
        required : true
    }
})

export const ParentCategory = mongoose.model('ParentCategory' , ParentCategorySchema);