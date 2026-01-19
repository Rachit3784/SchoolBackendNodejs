import { CartModel } from "../models/CartSchema.js";
import { OrderModel } from "../models/OrderSchema.js";
import { PaymentModel } from "../models/PaymentsSchema.js";
import { ProductModel } from "../models/ProductSchema.js";
import { Users } from "../models/UserSchema.js";
import { VarientModel } from "../models/VarientSchema.js";
import { WishListModel } from "../models/WishListSchema.js";

export const OrderProduct = async (req, res) => {
  try {
    const {
      customerId,
      paymentDone = false,
      paymentMethod,
      paymentId,
      cart,
      totalAmountToPay,
      totalAmountOfProductsMoney,
      DeliveryCharge,
      PlatFormFees,
      HandellingFees,
      WalletDiscount,
      totalDiscountedMoney,
      deliveryAddress,
      appliedOfferId,
      
    } = req.body;


    if (!customerId || !cart?.length || !deliveryAddress || !paymentMethod) {
      return res.status(400).json({
        msg: "Required details are missing",
        success: false,
      });
    }

    if (paymentMethod === "UPI" && !paymentId) {
      return res.status(400).json({
        msg: "Payment Id is missing",
        success: false,
      });
    }

    // ✅ Create order
    const order = await OrderModel.create({  
      customerId,
      appliedOfferId: appliedOfferId || null,
      cart,
      deliveryAddress,
      totalAmountToPay,
      totalAmountOfProductsMoney,
      DeliveryCharge,
      PlatFormFees,
      HandellingFees,
      totalDiscountedMoney,
      paymentMethod,
      WalletDiscount,
      paymentDone,
      paymentId: paymentId || null,
    });


    


    
    if (paymentDone && paymentMethod === "UPI") {
      await PaymentModel.findByIdAndUpdate(
        paymentId,
        { $set: { orderId: order._id } },
        { new: true }
      );
    }

    

    for (const item of cart) {
      const updatedVariant = await VarientModel.findByIdAndUpdate(
        item.variantId,
        { $inc: { Stock: -item.quantity } },
        { new: true }
      );


      if (!updatedVariant) {
        throw new Error(`Variant not found: ${item.variantId}`);
      }
    }



    
    await Users.findByIdAndUpdate( customerId, { $inc: { totalOrder: 1 , WalletMoney : -WalletDiscount} },  { new: true } );




    return res.status(201).json({
      msg: "Order placed successfully",
      success: true,
      order,
    });



  } catch (error) {
    console.error("Order Error:", error);
    return res.status(500).json({
      msg: error.message || "Internal Server Error",
      success: false,
    });
  }
};



export const FetchOrderLists = async (req, res) => {
  try {
    const { customerId } = req.query;

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    

    if (!customerId) {
      return res.status(400).json({
        msg: "customerId is required",
        success: false,
      });
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const orders = await OrderModel.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("deliveryAddress");

      
    return res.status(200).json({
      msg: "Successfully fetched orders",
      success: true,
      currentPage: page,
      count: orders.length,
      orders : orders,
    });

  } catch (error) {
    console.error("FetchOrderLists Error:", error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};



export const AddToCart = async (req, res) => {
  try {
    const { customerId, productId, varientId } = req.body;

    if (!customerId || !productId || !varientId) {
      return res.status(400).json({
        msg: "Required fields missing",
        success: false,
      });
    }

    const variant = await VarientModel.findById(varientId);
    if (!variant) {
      return res.status(404).json({
        msg: "Product variant not found",
        success: false,
      });
    }

    const discountedPrice = variant.pricing.discountedPrice; // per unit
    const actualMRP = variant.pricing.actualMRP;             // per unit

    let cart = await CartModel.findOne({ customerId });
    let perticularItem = null;

    if (cart) {
      const cartItem = cart.cartProduct.find(
        (item) => item.variantId.toString() === varientId
      );

      if (cartItem) {
        cartItem.actualMRP = actualMRP
        cartItem.discountedPrice = discountedPrice
        cartItem.quantity += 1;

        perticularItem = cartItem.toObject();
      } else {
        const newItem = {
          productId,
          variantId: varientId,
          actualMRP,
          discountedPrice,
          ProductAmount: variant.ProductAmount, 
          quantity: 1,
          coverImage: variant.coverImage,
        };

        cart.cartProduct.push(newItem);
        perticularItem = newItem;
      }

      // ✅ cart level totals
      cart.totalAmountToPay += discountedPrice;
      cart.totalDiscountedMoney += actualMRP - discountedPrice;

      await cart.save();

      return res.status(200).json({
        msg: "Cart updated successfully",
        success: true,
        cart,
        perticularItem,
      });
    }

    // 🆕 Create new cart
    cart = await CartModel.create({
      customerId,
      cartProduct: [
        {
          productId,
          variantId: varientId,
          actualMRP,
          discountedPrice,
          ProductAmount: variant.ProductAmount,
          quantity: 1,
          coverImage: variant.coverImage,
        },
      ],
      totalAmountToPay: discountedPrice,
      totalDiscountedMoney: actualMRP - discountedPrice,
    });

    return res.status(201).json({
      msg: "Product added to cart",
      success: true,
      cart,
      perticularItem: cart.cartProduct[0],
    });

  } catch (error) {
    console.error("AddToCart Error:", error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};


export const orderCartCollection =  async (req, res) => {
  try {
    const { customerId, cart , totalAmountToPay  ,  totalDiscountedMoney , paymentDone} = req.body;

    if (!customerId || !cart || !totalAmountToPay , totalDiscountedMoney , paymentDone) {
      return res.status(400).json({
        msg: "Required fields missing",
        success: false,
      });
    }

    


   

  } catch (error) {
    console.error("OrderError Error:", error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};




export const DeleteFromCart = async (req, res) => {
  try {
    const { varientId, customerId } = req.query;



    if (!varientId || !customerId) {
      return res.status(400).json({
        msg: "variantId or customerId is missing",
        success: false,
      });
    }

    const cart = await CartModel.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({
        msg: "Cart not found",
        success: false,
      });
    }

    const itemIndex = cart.cartProduct.findIndex(
      (item) => item.variantId.toString() === varientId
    );

    if (itemIndex === -1) {
      return res.status(400).json({
        msg: "Variant not found in cart",
        success: false,
      });
    }

    const item = cart.cartProduct[itemIndex];
    let perticularItem = null;

    if (item.quantity > 1) {
      item.quantity -= 1;
      perticularItem = item.toObject();
    } else {
      cart.cartProduct.splice(itemIndex, 1);
    }

    cart.totalAmountToPay -= item.discountedPrice;
    cart.totalDiscountedMoney -=
      item.actualMRP - item.discountedPrice;

    cart.totalAmountToPay = Math.max(cart.totalAmountToPay, 0);
    cart.totalDiscountedMoney = Math.max(cart.totalDiscountedMoney, 0);

    await cart.save();



    return res.status(200).json({
      msg: "Item removed successfully",
      success: true,
      cart,
      perticularItem,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};


 



export const FetchCartList = async (req,res)=>{
  try{

    const {customerId }  = req.query;


     let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;


    const skip = (page - 1 )*limit;



    if(!customerId) return res.status(400).json({msg : "Details is missing" , success : false});

    const cartList = await CartModel.find({customerId}).skip(skip).limit(limit).populate("variantId", "ProductName coverImage pricing rating");
    


    if(!cartList) return res.status(400).json({msg : "No Cart Data found" , success : false});



    return res.status(200).json({msg : "Fetched Cart Data" , success : true , cartList , currentPage : page , count : cartList.length})

  }catch(error){
    console.log(error)
    return res.status(500).json({msg : "Internal Server Error" , success :  false});
  }
}



export const AddtoWishList = async (req, res) => {
  try {
    const { customerId, productId, varientId, size } = req.body;

    if (!customerId || !productId || !varientId || !size) {
      return res.status(400).json({
        msg: "Details missing",
        success: false,
      });
    }

    const variant = await VarientModel.findById(varientId);
    if (!variant) {
      return res.status(400).json({
        msg: "Product variant not found",
        success: false,
      });
    }

    const existingCart = await WishListModel.findOne({
      customerId,
      productId,
      variantId: varientId,
      size,
    });

    if (existingCart) {
      return res.status(200).json({
        msg: "Already Existing Product into the list",
        success: false,
      });
    }

    const cartData = await WishListModel.create({
      customerId,
      productId,
      variantId: varientId,
      size,
      quantity: 1,
    });

    return res.status(200).json({
      msg: "Added to wishlist successfully",
      success: true,
      wishListId : cartData._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};



export const CheckWishList = async (req, res) => {
  try {
    const { customerId, productId, varientId, size } = req.body;

    if (!customerId || !productId || !varientId || !size) {
      return res.status(400).json({
        msg: "Details missing",
        success: false,
      });
    }


    
    const existingCart = await WishListModel.findOne({
      customerId,
      productId,
      variantId: varientId,
      size,
    });

   

    if (existingCart) {
 

      return res.status(200).json({
        msg: "Already Existing Product into the list",
        success: true,
        wishListId : existingCart._id
      });
    }

    
    return res.status(200).json({
      msg: "No in the List ",
      success: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
    });
  }
};


export const DeleteFromWishlist =  async (req,res)=>{
  try{

    const {WishlistId} = req.query;

    if(!WishlistId) res.status(400).json({msg : "CartId is missing " , success : false});


 
    const cart = await WishListModel.findByIdAndDelete(WishlistId);

    if(!cart) return res.status(400).json({msg : "Failed to delete" , success : false});

    return res.status(200).json({msg : "Successfully Deleted" , success : true , WishlistId});



  }catch(error){
    console.log(error)
    return res.status(500).json({msg  : 'Internal Server Error ' , success : false});
  }
}



export const FetchWishList = async (req,res)=>{
  try{

    const {customerId}  = req.query;


     let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;


    const skip = (page - 1 )*limit;



    if(!customerId) return res.status(400).json({msg : "Details is missing" , success : false});

    const Wishlist = await WishListModel.find({customerId}).skip(skip).limit(limit).populate("variantId", "ProductName coverImage pricing rating");
    


    if(!Wishlist) return res.status(400).json({msg : "No Cart Data found" , success : false});



    return res.status(200).json({msg : "Fetched Cart Data" , success : true , Wishlist , currentPage : page , count : Wishlist.length})

  }catch(error){
    console.log(error)
    return res.status(500).json({msg : "Internal Server Error" , success :  false});
  }
}
