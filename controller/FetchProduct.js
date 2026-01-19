import { AddressModel } from "../models/AddressSchema.js";
import { ProductModel } from "../models/ProductSchema.js";
import { VarientModel } from "../models/VarientSchema.js";

export const trendingProduct = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const trendingProductList = await VarientModel.find({ Trending: true })
      .sort({ TotalLikes: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        `
        ProductName
        pricing
        Parent
        coverImage
        rating
        Quantity
        TotalLikes
        `
      )
      .populate({
        path: "Parent",
        model: "Products",
        select: "Category",
      });

    if (!trendingProductList.length) {
      return res.status(404).json({
        msg: "No trending products found",
        success: false,
      });
    }

    return res.status(200).json({
      msg: "Trending products fetched successfully",
      success: true,
      page,
      limit,
      TrendingProductList: trendingProductList,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};




export const FetchPerticularProduct = async (req, res) => {
  try {
    const { parentId, variantId } = req.query;

    if (!parentId || !variantId) {
      return res.status(400).json({
        msg: "ParentId or VariantId missing",
        success: false,
      });
    }

    /* ================= PARENT PRODUCT ================= */
const ParentProduct = await ProductModel.findById(parentId)
      .select(
        "StoreOwnerId StoreId ProductDescription FAQS Reviews Variants ReviewImages ReturnPolicy TotalReviews TimeToDelivar"
      )
      .populate({
        path: "Variants",
        model: "ProductVariants",
        select: "coverImage _id ProductName images ProductAmount",
      }).populate({
        path : 'StoreId',
        select : 'address'
      });

    if (!ParentProduct) {
      return res.status(404).json({
        msg: "Parent product not found",
        success: false,
      });
    }

    /* ================= SELECTED VARIANT ================= */
    const VarientChild = await VarientModel.findById(variantId).select(`
      ProductName
      ProductKeywords
      pricing
      ProductAmount
      images
      coverImage
      rating
      ratingMap
      videoLinks
      Trending
      Stock
      TotalLikes
      TotalShared
      totalSold
      Parent
      offers
    `);

    if (!VarientChild) {
      return res.status(404).json({
        msg: "Variant not found",
        success: false,
      });
    }

    /* ================= VALIDATION ================= */
    if (VarientChild.Parent.toString() !== parentId.toString()) {
      return res.status(400).json({
        msg: "Variant does not belong to the selected product",
        success: false,
      });
    }

    /* ================= NORMALIZE ================= */
    const normalizedVariant = {
      id: VarientChild._id.toString(),
      ProductName: VarientChild.ProductName,
      ProductKeywords: VarientChild.ProductKeywords,
      pricing: VarientChild.pricing,        // { actualMRP, discountPercentage, discountedPrice }
      ProductAmount: VarientChild.ProductAmount,
      images: VarientChild.images,
      coverImage: VarientChild.coverImage,
      rating: VarientChild.rating,
      ratingMap: VarientChild.ratingMap,
      videoLinks: VarientChild.videoLinks,
      Trending: VarientChild.Trending,
      Stock: VarientChild.Stock,
      TotalLikes: VarientChild.TotalLikes,
      TotalShared: VarientChild.TotalShared,
      totalSold: VarientChild.totalSold,
      Parent: VarientChild.Parent,
      offers: VarientChild.offers,
    };

    const normalizedParent = {
      ...ParentProduct.toObject(),
      Variants:
        ParentProduct.Variants?.map(v => ({
          _id: v._id.toString(),
          id: v._id.toString(),           // for convenience if needed later
          ProductName: v.ProductName,
          coverImage: v.coverImage,
          ProductAmount: v.ProductAmount,
        })) || [],
    };

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      msg: "Product fetched successfully",
      success: true,
      ParentProduct: normalizedParent,
      SelectedVariant: normalizedVariant,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};



export const FetchSearchedProduct = async (req, res) => {
  try {
    let { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    // First, search variants
    let variants = await VarientModel.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("ProductName Parent pricing rating coverImage Stock ProductAmount ")
      .populate({
        path: "Parent", // populate parent product
        select: "StoreId",
        populate: {
          path: "StoreId", // populate store
          select: "address",
        },
      });

    // Fallback search if no variants found
    if (variants.length === 0) {
      variants = await VarientModel.find({
        $or: [
          { ProductName: { $regex: q, $options: "i" } },
          { ProductKeywords: { $regex: q, $options: "i" } },
          { Category: { $regex: q, $options: "i" } },
        ],
      })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select("ProductName Parent pricing rating coverImage Stock ProductAmount")
        .populate({
        path: "Parent", // populate parent product
        select: "StoreId",
        populate: {
          path: "StoreId", // populate store
          select: "address",
        },
      });
    }

    // Format response to include storeId and addressId
    const data = variants.map((v) => ({
      ...v.toObject(),
      StoreId: v.Parent?.StoreId?._id || null,
      address: v.Parent?.StoreId?.address || null,
    }));

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};


export const getNearbyProducts = async (req, res) => {
  try {
    const { latitude, longitude, page = 1, limit = 10 } = req.query;

 
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        msg: "Latitude and longitude are required",
      });
    }

   

const pageNum = parseInt(page, 10);
const limitNum = parseInt(limit, 10);

if (isNaN(pageNum) || isNaN(limitNum)) {
  return res.status(400).json({ success: false, msg: "Page and limit must be numbers" });
}

const skip = (pageNum - 1) * limitNum;

const products = await AddressModel.aggregate([
      
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          maxDistance: 20000, // 20 km
          spherical: true,
        },
      },
      {
        $match: {
          ownerType: "Stores", // only store addresses
        },
      },

      // 🔗 Step 2: Join Address -> Store
      {
        $lookup: {
          from: "stores",
          localField: "ownerId",
          foreignField: "_id",
          as: "store",
        },
      },
      { $unwind: "$store" },

      // 🔗 Step 3: Join Store -> Product
      {
        $lookup: {
          from: "products",
          localField: "store._id",
          foreignField: "StoreId",
          as: "products",
        },
      },
      { $unwind: "$products" },

      // 🔗 Step 4: Join Product -> Variants
      {
        $lookup: {
          from: "productvariants",
          localField: "products._id",
          foreignField: "Parent",
          as: "variants",
        },
      },

      // 📤 Step 5: Shape response
      {
        $project: {
          
          _id: "$products._id",
         
          ProductDescription: "$products.ProductDescription",
          
          TotalReviews: "$products.TotalReviews",
          // TimeToDelivar: "$products.TimeToDelivar",

          Store: {
            _id: "$store._id",
            StoreAddressID : "$store.address",
            StoreName: "$store.StoreName",
            coverImage: "$store.coverImage",
            OpeningTime: "$store.OpeningTime",
            ClosingTime: "$store.ClosingTime",
            Is24Hours: "$store.Is24Hours",
            StoreEmail: "$store.StoreEmail",
            StoreContactNumber: "$store.StoreContactNumber"
          },

          variants: {
            $map: {
              input: "$variants",
              as: "v",
              in: {
                _id: "$$v._id",
                ProductName: "$$v.ProductName",
                ProductAmount: "$$v.ProductAmount",
                pricing: "$$v.pricing",
                coverImage: "$$v.coverImage",
                images: "$$v.images",
                rating: "$$v.rating",
                Category: "$$v.Category",
                Stock: "$$v.Stock",
                totalSold: "$$v.totalSold",
                Trending: "$$v.Trending"
              },
            },
          },

          distance: 1,
        },
      },

      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    res.status(200).json({
      success: true,
      msg: "Nearby products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Nearby Products Error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};


// Corrected Backend: FetchProductofAllCategory
export const FetchProductofAllCategory = async (req, res) => {
  try {
    // Standardize to Parent (with an 'e') to match Frontend
    const { ParentCategoryId, page = 1, limit = 10 } = req.query;
    
    if (!ParentCategoryId) {
      return res.status(400).json({ msg: 'CategoryId is required', success: false });
    }
  
    const skip = (page - 1) * limit;
    
    // Check your MongoDB Schema: if field is ParantCategoryId, use that here
    const Products = await VarientModel.find({ ParantCategoryId: ParentCategoryId })
      .skip(skip)
      .limit(parseInt(limit)).populate({
      path : 'Parent',
      select : 'StoreId',
      populate : {
        path : 'StoreId',
        select : 'address'
      }
    });

    if (!Products || Products.length === 0) {
      return res.status(200).json({ msg: 'No products found', success: true, Products: [] });
    }

    return res.status(200).json({ msg: 'Successfully Fetched', success: true, Products });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
};

export const FetchCategoryProduct = async (req,res)=>{
  try{
    const {CategoryId , page , limit} = req.query;

    if(!CategoryId) return res.status(400).json({msg : 'Failed To Fetch ' , success : false});
    const Products = await VarientModel.find({CategoryId}).skip((page-1)*limit).limit(limit).populate({
      path : 'Parent',
      select : 'StoreId',
      populate : {
        path : 'StoreId',
        select : 'address'
      }
    })

    if(!Products.length) return res.status(400).json({msg : 'Failed to Fetch' , success : false});

    return res.status(200).json({msg : 'Successfully Fetched Product' , success : true , Products});

  }catch(error){
    console.log(error)
    return res.status(500).json({msg : 'Internal Server Error' , success : false});
  }
}

