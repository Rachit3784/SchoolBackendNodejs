
import { Contest } from "../models/ContestModel.js";
import { ContestParticipants } from "../models/ContestParticipants.js";
import { Users } from "../models/UserSchema.js";


export const getContestsPaginated = async (req, res) => {


  try {
   
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const status = req.query.status;
    const skip = (page - 1) * limit;

    
    let queryFilter = {};
    if (status && status !== "All") {
      queryFilter.status = status;
    }

    // 3️⃣ Parallel DB queries (FAST)
    const [contests, total] = await Promise.all([
      Contest.find(queryFilter) // Dynamic filter yahan pass hoga
        .sort({ createdAt: -1 }) // latest first
        .skip(skip)
        .limit(limit)
        .lean(),

      Contest.countDocuments(queryFilter), // Count me bhi filter dena zaruri hai correct pagination ke liye
    ]);

    // 4️⃣ Response
    return res.status(200).json({
      success: true,
      data: contests,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + contests.length < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get contests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contests",
    });
  }
};

export const RegisterContest = async (req,res)=>{
  try{
    const {userId, contestId} = req.body;

    const ContestData = await Contest.findById(contestId);
    
    if(ContestData.status === 'Expired'){
      return res.status(400).json({msg : 'Already Registered' , success : false});
    }
   
    const user = await Users.findById(userId);

    if(!userId) return res.status(400).json({msg : 'User not existing' , success : false});

    
    const ContestParticipantRecord = await ContestParticipants.create({
      userId,contestId
    })
    return res.status(400).json({msg : 'Participated' , success : true , ContestParticipantRecord});
  }catch(error){
    return res.status(500).json({msg  :'Internal Server Error' , success : false});
  }
}
