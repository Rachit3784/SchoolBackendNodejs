// import cron from "node-cron";
// import { AdmissionModel } from "../models/AdmissionModel.js";


// cron.schedule("0 0 * * *", async () => {
//   console.log("Running admission expiry cron");

//   const oneMonthAgo = new Date();
//   oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

//   await AdmissionModel.updateMany(
//     {
//       status: { $nin: ["Accepted", "Expired"] },
//       createdAt: { $lte: oneMonthAgo }
//     },
//     { $set: { status: "Expired" } }
//   );
// });
