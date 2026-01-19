import { VarientModel } from "../models/VarientSchema.js";

/* ===============================
   GLOBAL MEMORY (SESSION LEVEL)
================================ */

const GlobalFeedMemory = new Map();
const GlobalFeedMemoryTimeOut = new Map();

const TTL = 30 * 60 * 1000; // 30 minutes
const BLOCKS_PER_REQUEST = 3;

/* ===============================
   HELPER: FETCH DATA PER BLOCK
================================ */
async function fetchBlockData(blockType, context) {
  const { page, limit } = context;

  const skip = (page - 1) * limit;

  switch (blockType) {

    case "TrendingGlobal":
      return await VarientModel.find({ Trending: true })
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id ProductName Parent pricing coverImage rating");

    case "Horizontal":
      return await VarientModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id ProductName Parent pricing coverImage rating");

    default:
      return [];
  }
}


export const HomeScreenFeed = async (req, res) => {
  try {
    const { userId, limit = 4 } = req.query;
   
    if (!userId) {
      return res.status(400).json({
        success: false,
        msg: "userId required",
      });
    }

    /* ===============================
       INIT MEMORY
    ================================ */


    if (!GlobalFeedMemory.has(userId)) {
      GlobalFeedMemory.set(userId, {
        lastActiveIndex: 0,

        shownBlocks: {
          TrendingGlobal: 0,
          Horizontal: 0,
        },

        signals: {
          TrendingGlobal: 0,
          Horizontal: 0,
        },

        blocksConfig: {
          TrendingGlobal: {
            baseScore: 25,
            frequency: 2,
            repeatPenalty: 10,
          },
          Horizontal: {
            baseScore: 15,
            frequency: 4,
            repeatPenalty: 6,
          },
        },

        blockPagination: {
          TrendingGlobal: { page: 1 },
          Horizontal: { page: 1 },
        },

        createdAt: Date.now(),
      });
    }

    /* ===============================
       RESET TTL
    ================================ */
    if (GlobalFeedMemoryTimeOut.has(userId)) {
      clearTimeout(GlobalFeedMemoryTimeOut.get(userId));
    }

    const timeout = setTimeout(() => {
      GlobalFeedMemory.delete(userId);
      GlobalFeedMemoryTimeOut.delete(userId);
    }, TTL);

    GlobalFeedMemoryTimeOut.set(userId, timeout);

    /* ===============================
       FEED RANKING LOGIC
    ================================ */
    const feed = GlobalFeedMemory.get(userId);
    const scoredBlocks = [];

    for (const block in feed.blocksConfig) {
      const config = feed.blocksConfig[block];
      const shownCount = feed.shownBlocks[block];

      if (shownCount >= config.frequency) continue;

      const finalScore =
        config.baseScore +
        feed.signals[block] -
        (shownCount /config.frequency) * config.repeatPenalty;

      scoredBlocks.push({ block, score: finalScore });
    }

    if (!scoredBlocks.length) {
      scoredBlocks.push({ block: "TrendingGlobal", score: 0 });
    }

    scoredBlocks.sort((a, b) => b.score - a.score);
    const selectedBlocks = scoredBlocks.slice(0, BLOCKS_PER_REQUEST);

    /* ===============================
       FETCH BLOCK DATA (VERSIONED)
    ================================ */
    const responseBlocks = [];

    for (const { block } of selectedBlocks) {
      const page = feed.blockPagination[block].page;

      const data = await fetchBlockData(block, {
        page,
        limit: Number(limit),
      });
 
      responseBlocks.push({
        type: block,
        page,
        limit,
        data,
      });


      

      // Update memory
      feed.shownBlocks[block] += 1;
      feed.blockPagination[block].page += 1;
    }

    feed.lastActiveIndex += responseBlocks.length;



    /* ===============================
       RESPONSE
    ================================ */
    return res.status(200).json({
      success: true,
      index: feed.lastActiveIndex,
      blocks: responseBlocks,
    });

  } catch (error) {
    console.error("Feed Error:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};
