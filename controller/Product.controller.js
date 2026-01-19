import { deleteFromCloudinary, uploadBuffer } from "../config/ConnectCloudinary.js";
import { ProductModel } from "../models/ProductSchema.js";
import { VarientModel } from "../models/VarientSchema.js";
import { generateEmbedding } from "./EmbeddingCreation.js";




 



export const AddProduct  =  async (req,res)=>{
    try{
        const {
        StoreOwnerId,  
        StoreId ,
        Quantity,
        ProductName,
        ProductDescription ,
        ProductKeywords ,
        ProductAmount,
        ReturnPolicy,
        pricing,
        Stock, 
        } = req.body;
       
        if(!StoreOwnerId ||   
         !StoreId ||
         !ProductName ||
         !ProductPrice ||
         !ProductDescription ||
         !ProductKeywords ) return res.status(400).json({msg : "Details is missing" , success : false});

const keywords = JSON.parse(ProductKeywords);
const Size = JSON.parse(ProductSize);
        const text = `${ProductDescription} ${keywords.join(",")}`;
        const ProductEmbedding = await generateEmbedding(text);
        

        if(!ProductEmbedding.embeddings) return res.status(400).json({msg : "Product" , success : false})


          
            const coverFile =  Array.isArray(req.files?.productcoverImages) && req.files.productcoverImages.length > 0
        ? req.files.productcoverImages[0]
        : null;

    if (!coverFile) {
      return res.status(400).json({
        success: false,
        msg: "Cover image file missing in request.",
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const baseName = coverFile.originalname.split(".")[0];
    const publicId = `productcoverImages_${StoreId}_${baseName}_${dateStr}_${Math.random()}`;
    
    const uploadRes = await uploadBuffer(coverFile.buffer, {
      folder: `productcoverImages/${StoreId}`,
      public_id: publicId,
    });

    if (!uploadRes?.secure_url) {
      return res.status(400).json({
        success: false,
        msg: "Failed to upload image to Cloudinary.",
      });
    }
    
 
       const varient = await VarientModel.create({
          ProductName,
  ProductPrice,
   ProductSize : Size,
 ProductLengthCm,
 ProductKeywords,
Quantity,
coverImage: uploadRes.secure_url,
VideoLink : [ProductVideoUrl]
       })
       if(!varient){

          await deleteFromCloudinary(publicId)
        return res.status(400).json({msg : "Failed To Upload Product" , success : false});
       }
         const product = await ProductModel.create({


            StoreOwnerId,  
         StoreId,
         Variants : [varient._id],
         ProductDescription,
         
         ProductEmbeddings : ProductEmbedding.embeddings,
        
         })

         if(!product){
          await VarientModel.findByIdAndDelete(varient._id)
           await deleteFromCloudinary(publicId)
        return res.status(400).json({msg : "Failed To Upload Product" , success : false});
         }

         
         if(product){
          await VarientModel.findByIdAndUpdate(varient._id , {$set : {Parent : varient._id}} , {new : true})
return res.status(200).json({msg : "Product Added Successfully" , success : true});
         }
         
         
    }catch(error){
        console.log(error)
        return res.status(500).json({msg : "Internal Server Error" , success : false});
    }
}


export const AddProductImages = async (req, res) => {
  try {
    const { productId } = req.body;
    

    if (!productId)
      return res.status(400).json({ msg: "Product ID is missing", success: false });

    const exist = await ProductModel.findById(productId);
    if (!exist)
      return res.status(404).json({ msg: "Product does not exist", success: false });

    const images = Array.isArray(req.files?.images)
      ? req.files.images
      : [req.files?.images].filter(Boolean);

    if (!images.length)
      return res.status(400).json({ msg: "No images provided", success: false });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const uploadedImages = [];

    const uploads = await Promise.all(
      images.map((file, index) => {
        const imgName = file.originalname.split(".")[0];
        const publicId = `Product_${productId}_${imgName}_${dateStr}_${index}`;
        return uploadBuffer(file.buffer, {
          folder: `Product_Images/${productId}`,
          public_id: publicId,
        });
      })
    );

    uploads.forEach((result) => {
      if (result?.secure_url) uploadedImages.push(result.secure_url);
    });

    if (!uploadedImages.length)
      return res.status(400).json({ msg: "Failed to upload images", success: false });

    // Push new images into Images array
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      { $push: { Images: { $each: uploadedImages } } },
      { new: true }
    );


    

    if (!updatedProduct)
      return res.status(400).json({ msg: "Failed to update product images", success: false });

    return res.status(200).json({
      msg: "Images uploaded successfully",
      success: true,
      
    });
  } catch (error) {
   
    console.error(error);
    return res.status(500).json({ msg: "Internal Server Error", success: false });
  }
};


export const DeleteProduct = async (req,res)=>{
    try{
    const {ProductId} = req.body;

    if(!ProductId) return res.status(400).json({msg  :"Product Id is missing" , success: false});

    const Product = await ProductModel.findById(ProductId);

    if(!Product) return res.status(400).json({msg : "Product Not Found" , success : false});
    
    const deleteCoverImage = await deleteFromCloudinary(Product.coverImage.toString());

    if(!deleteCoverImage) return res.status(400).json({msg : "Failed To Delete Image due to image deletion" , success : false});

    Product.Images.map(async (item)=>{
       const response = await deleteFromCloudinary(item)
       if(!response) return res.status(400).json({msg  :"Failed to delete " , success : false})

    });


    const deletedProduct = await ProductModel.findByIdAndDelete(ProductId)
    

    if(!deletedProduct)  return res.status(400).json({msg  :"Failed to delete " , success : false})


    return res.status(200).json({msg : "Successfully Deleted Product" , success : true});

    }catch(error){
        console.log(error)
        return res.status(500).json({msg : "Internal Server Error" , success : false});
    }
}



export const fetchMyProducts = async (req,res)=>{
  try{

    const {page=1,limit=3,storeId} = req.query

  const skip = (page - 1)*limit;

 const products = await ProductModel.find({ StoreId: storeId })
    .skip(skip)
    .limit(limit)
    .populate({
    path: 'Variants',
    select: 'ProductName ProductPrice ProductSize ProductLengthCm coverImage TotalLikes TotalShared Quantity'  
  })
  .select('Category  , offerApplied');
  
  if(!products || products.length === 0) {
        return res.status(200).json({msg : "No Products Found" , success : true, products: []});
    }

  return res.status(200).json({msg  : "Product List Fetched " , success : true , products})
  }catch(error){
    console.log(error);
    return res.status(500).json({msg : "Internal Server Error" , success : false});
  }
}




export const fetchAllMyProducts = async (req, res) => {
    try {
        
 
       const { page = 1 , limit = 10 , OwnerId} = req.query; 

       if (!OwnerId || OwnerId === "") {
         
            return res.status(400).json({ msg: "StoreIds missing or invalid format.", success: false });
        }

        const queryLimit = parseInt(limit, 10) || 10;
        const queryPage = parseInt(page, 10) || 1; 
        const skip = (queryPage - 1) * queryLimit;

  
        

     const products = await ProductModel.find({ StoreOwnerId : OwnerId })
     .skip(skip)
     .limit(limit)
     .populate({
     path: 'Variants',
     select: 'ProductName ProductPrice ProductSize ProductLengthCm coverImage TotalLikes TotalShared Quantity'  
   })
    .select('Category  , offerApplied');


        

        if (products !== null) { 
            return res.status(200).json({
                msg: "Product List Fetched",
                success: true,
                products: products,
                hasMore: products.length === queryLimit
            });
        }

        return res.status(500).json({ msg: "Product query failed unexpectedly.", success: false });

    } catch (error) {
        console.error("Critical Server Error in fetchAllMyProducts:", error);
        return res.status(500).json({ msg: "Internal Server Error. Please check backend logs.", success: false });
    }
};


export const FetchSelectedProduct = async (req,res)=>{
  try{



    const {ProductId} = req.query


    if(!ProductId) return res.status(400).json({msg  : "Failed To Fetch" , success : false});

    const product = await ProductModel.findById(ProductId);
   
    if(!product) return res.status(400).json({msg : "Failed to fetch " , success : false});

    return res.status(200).json({msg : "Fetched Successfully" , success : true , Product : product})
  }catch(error){
    console.log(error)
    return res.status(500).json({msg : "Internal Server Error" , success : false})
  }

}

export const updateProduct = async (req,res)=>{
           try{
                
           }catch(error){

           }
}