/**
 * Created by hw on 2016/4/26.
 */
module.exports = {
    user:{
        name:{type:String,required:true},
        password:{type:String,required:true},
        IsAdmin:{type:Boolean,required:true},
        forbid:{type:Boolean,required:true},
    }
};