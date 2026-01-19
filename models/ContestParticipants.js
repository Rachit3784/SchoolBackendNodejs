import mongoose from "mongoose";

const ContestParticipantSchema = new mongoose.Schema({
    userId  : {
       type : mongoose.Schema.Types.ObjectId,
       ref : 'Users',
       required  : true 
    },
    ContestId : {
       type : mongoose.Schema.Types.ObjectId,
       ref : 'Contest',
       required  : true 
    },
    Status : {
        type : String,
        enum  : ['Enrolled','Present','Attended','Qualified'],
        default : 'Enrolled'
    }

});

export const ContestParticipants = mongoose.model('ContestsParticipants',ContestParticipantSchema)