import Razorpay from "razorpay"
import { Razor_pay_api_key, Razor_pay_secret_key } from "./ENV_variable.js"

export const createRazorPayInstance = ()=>{
    const rayorpayinstance = new Razorpay({
        key_id : Razor_pay_api_key,
        key_secret : Razor_pay_secret_key
    })

    return rayorpayinstance;
}
