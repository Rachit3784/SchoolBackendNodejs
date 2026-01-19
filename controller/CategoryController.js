import { CategoryModel } from "../models/CategorySchema.js";
import { ParentCategory } from "../models/ParantCategory.js";

export const CreateNewCategory = async (req,res)=>{
    try{
    const {CategoryName , CategoryCoverImage , CategoryTitle , SubCategoryList} = req.body;

    if(!CategoryName || !CategoryCoverImage || !CategoryTitle || !SubCategoryList) return res.status(400).json({msg : "Deatails is missing" , success : false});
    
    const CategoryData = await CategoryModel.create({
        CategoryTitle,
        CategoryCoverImage,
        CategoryName,
        SubCategoryList
    })

    if(!CategoryData){
        return res.status(400).json({msg : 'Failed To Add Category' , success : false})
    }

    return res.status(200).json({msg : 'Success' , success : true});
    
    }catch(error){
        console.log(error)
        return res.status(500).json({msg : "Internal Server Error" , success :  false});
    }
}


export const FetchCategory = async (req,res)=>{
try{
    const {categoryTitle} = req.query;
 
    const Categories = await ParentCategory.find({ CategoryTitle: { $regex: `^${categoryTitle}$`, $options: "i" }});
 

    if(!Categories.length) return res.status(400).json({msg : 'Failed To Fetch Categories' , success : false});

    return res.status(200).json({msg : 'Successfully Fetched Categories' , success : true , Categories});


}catch(error){
    console.log('Error' , error);
    return res.status(500).json({msg : 'Internal Server Error' , success : false});
}
}


export const FetchSelectedSubCategories = async (req,res)=>{
    try{

        const {CategoryId , page = 1, limit  = 10}  = req.query;
       
        const skip = (page - 1)*limit;

        const CatogryData = await CategoryModel.find({ParentCategoryId : CategoryId}).skip(skip).limit(limit);

        if(!CatogryData.length) return res.status(400).json({msg : 'Failed to fetch Category' , success : false});


        return res.status(200).json({msg : 'Successfully Fetched Category' , success : true , CatogryData});

    }catch(error){
        console.log(error)
        return res.status(500).json({msg : 'Internal Server Error' , success : false});
    }
}

