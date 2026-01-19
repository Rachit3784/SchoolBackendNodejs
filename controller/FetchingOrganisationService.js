import { StoreModel } from "../models/StoreSchema.js";

export const getNearByStores = async (req, res) => {
  try {
    const { latitude, longitude , page = 1 , limit = 10 } = req.query;
  
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, msg: "Coordinates missing" });
    }
   

    const radiusInMeters = 50 * 1000;
    const skip = (page - 1)*limit

    
    const nearbyStores = await StoreModel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    })
      .skip(skip).limit(10)
      .select("StoreName coverImage OpeningTime ClosingTime Is24Hours TotalRatings location address");

   
    // const topRatedStores = await StoreModel.find({
    //   TotalRatings: { $gt: 0 },
    // })
    //   .sort({ TotalRatings: -1 })
    //   .limit(10)
    //   .select("StoreName coverImage Description TotalRatings location");

// console.log(nearbyStores)

    res.status(200).json({
      msg : "Fetched Stores Successfully",
      success: true,
      nearbyTop50: nearbyStores,
    
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};


export const getAllStore = async (req,res)=>{
  try{
    console.log("I am Called")
    const {page , limit = 10} = req.query;
    const skip = (page - 1)*limit
    
    const StoreList = await StoreModel.find().skip(skip).limit(limit).select("StoreName coverImage OpeningTime ClosingTime Is24Hours TotalRatings location address");;

    if(!StoreList) return res.status(400).json({msg  :"Failed To Fetch" , success : false});

    return res.status(200).json({
      msg : "Fetched Successfully",
      success : true,
    allStore : StoreList
    })
    
  }catch(error){
    console.log(error)
    return res.status(500).json({msg : "Internal Server Error" , success : false});
  }
}

