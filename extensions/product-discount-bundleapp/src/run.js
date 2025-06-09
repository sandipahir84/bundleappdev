// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  const allSections=configuration?.sections??[];
  const discountType=configuration?.discount_type??'';
  const discount_value=configuration?.discount_value??'';
  const title = (configuration?.title ?? '').toLowerCase();

  const status=configuration?.status??'';

  if(status!='active'){
    return EMPTY_DISCOUNT;
  }

  

  console.log("configuration", JSON.stringify(configuration.status));
  // console.log("configuration", JSON.stringify(configuration.sections));


  const CartSimple = {};
  const varCart = input?.cart?.lines ?? [];
  var targetsAmout =0;
  var targetsAmoutQty =0;


  varCart.forEach(item => {
    const merchandiseId = item.merchandise.id;
    const collections = item.merchandise.product.inCollections;
    const price = parseFloat(item.cost.amountPerQuantity.amount);
    const bundle_name = (item?.bundle_name?.value ?? '').toLowerCase();
    if(bundle_name==title && title!=''){
      
      if (CartSimple[merchandiseId]) {
        CartSimple[merchandiseId].qty += item.quantity;
      } else {
        CartSimple[merchandiseId] = {
          qty: item.quantity,
          price: price,
          id:item.id
        };
      }
    
      collections.forEach(collection => {
        if (collection.isMember) {
          CartSimple[merchandiseId][collection.collectionId] = 1;
        }
      });
    }
  });
  
// Sort CartSimple by price
const sortedCartSimple = Object.fromEntries(
  Object.entries(CartSimple).sort((a, b) => a[1].price - b[1].price)
);

// Replace original CartSimple content
Object.keys(CartSimple).forEach(key => delete CartSimple[key]);
Object.assign(CartSimple, sortedCartSimple);
const length = Object.keys(CartSimple).length;

console.log("CartSimple++++",JSON.stringify(CartSimple));

    console.log("length+++ length",JSON.stringify(length)); 

    if(length<=0){
      return EMPTY_DISCOUNT;

    }
  

  const targets = [];

  const CurrentTargets = [];

  let sectionConditionCount = 0;
  let totalSteps = 0;
  let emptyDiscout = false;


  let nextStepsPossible = true;

while (nextStepsPossible) {
  var tmpFlagForCheck=false;
   totalSteps += 1;

  console.log("nextStepsPossible",JSON.stringify(nextStepsPossible)); 

  allSections.forEach(section => {
    var requirement = (section?.requirement ?? '').toLowerCase();
    var sectionQuantity=0
    var sectionQuantityCout=0


    if(requirement=='exactquantity'){
      sectionQuantity=section?.quantity ??0
    }
    else if(requirement=="minquantity"){
      sectionQuantity=section?.minquantity ??0
    }
    else if(requirement=="rangequantity"){
      sectionQuantity=section?.minquantity ??0
    }
    if (section.type === "product") {
      section.items.forEach(product => {

        for (const variant of product.variants) {

          // console.log("CartSimple+++",JSON.stringify(variant)); 

          if (CartSimple[variant.id] && CartSimple[variant.id].qty > 0) {


            const qtyAvailable = CartSimple[variant.id].qty;

            if (qtyAvailable < sectionQuantity){  
              break;
            } 

            for (let i = 0; i < qtyAvailable; i++) {
              var tmpFlag=false;
  
              if (CartSimple[variant.id] && CartSimple[variant.id].qty > 0) {
                // console.log("product variant gg++++ innnn",CartSimple[variant.id]);
    
                sectionQuantityCout += 1;
    
                // Reduce from CartSimple
                reduceQty(CartSimple, variant.id, 1);
            
                // Push to targetCart

                // const existingTarget = targets.find(t => t.productVariant.id === variant.id);

                // if (existingTarget) {
                //   existingTarget.productVariant.quantity += 1;
                // }
                // else{
                //   targets.push({
                //     productVariant: {
                //       id: variant.id,
                //       quantity: 1
                //     }
                //   });
                
                // }

               
              const existingTarget = targets.find(t => t.cartLine?.id === CartSimple[variant.id].id);

              if (existingTarget) {
              // If already exists, increase quantity
              existingTarget.cartLine.quantity += 1;
              } else {
              // If not found, push new object
              targets.push({
              cartLine: {
              id: CartSimple[variant.id].id,
              quantity: 1
              }
              });
              }

                sectionConditionCount=sectionConditionCount+1;

                

               
                tmpFlagForCheck=true;
                targetsAmout += parseFloat(CartSimple[variant.id].price); // Accumulate the amount
                targetsAmoutQty+=1;
                tmpFlag=true;
    
              }
              
              if(tmpFlag){
                // sectionConditionCount=sectionConditionCount+1;
  
              }

              if (CartSimple[variant.id].qty === 0) {
                // delete CartSimple[variant.id];
                // break;
                }
  
              // Stop loop if required quantity is reached
            if (sectionQuantityCout >= sectionQuantity){
              console.log("product sectionConditionCount++++",sectionConditionCount);
              tmpFlagForCheck=false;

  
              break;
            } 
             
            }

          }


          if (CartSimple[variant.id].qty === 0) {
            // delete CartSimple[variant.id];
            break;
            }


          
        
          // Stop loop if required quantity is reached
          if (sectionQuantityCout >= sectionQuantity){
            console.log("product sectionConditionCount++++",sectionConditionCount);
            tmpFlagForCheck=false
            break;
          } 

        }
        

        
      });
    }
  
    if (section.type === "collection") {
      
      for (const collection of section.items) {
        const collectionId = collection.id;
        console.log("collectionId++++",collectionId);
        console.log("sectionQuantityCout++++",sectionQuantityCout);


        for (const [merchandiseId, cartItem] of Object.entries(CartSimple)) {
          if (
            cartItem[collectionId] &&
            cartItem.qty > 0 &&
            sectionQuantityCout < sectionQuantity
          ) {
            const qtyAvailable = cartItem.qty;
            var tmpFlag=false;
            // console.log("qtyAvailable++++-",qtyAvailable);
            // console.log("sectionQuantity++++-",sectionQuantity);


           

            for (let i = 0; i < qtyAvailable; i++) {
              sectionQuantityCout += 1;
            
              reduceQty(CartSimple, merchandiseId, 1);

              // const existingTarget = targets.find(t => t.productVariant.id === merchandiseId);

              // if (existingTarget) {
              //   existingTarget.productVariant.quantity += 1;
              // }
              // else{
              //   targets.push({
              //     productVariant: {
              //       id: merchandiseId,
              //       quantity: 1
              //     }
              //   });
                
              
              // }

              const existingTarget = targets.find(t => t.cartLine?.id === CartSimple[merchandiseId].id);

              if (existingTarget) {
                // If already exists, increase quantity
                existingTarget.cartLine.quantity += 1;
              } else {
                // If not found, push new object
                targets.push({
                  cartLine: {
                    id: CartSimple[merchandiseId].id,
                    quantity: 1
                  }
                });
              }
              sectionConditionCount=sectionConditionCount+1;
          
              tmpFlagForCheck=true;

              targetsAmout += parseFloat(cartItem.price); // Accumulate the amount
              targetsAmoutQty+=1;

              tmpFlag=true;

              if(CartSimple[merchandiseId].qty <= 0){
                if (CartSimple[merchandiseId].qty === 0) {
                  // delete CartSimple[merchandiseId];
                  }
                break;
              }

              if (sectionQuantityCout >= sectionQuantity){
                console.log("product sectionQuantityCout++++ break",sectionQuantityCout);
                tmpFlagForCheck=false
    
                break;
              } 


            }
           

            if(tmpFlag){
              // sectionConditionCount=sectionConditionCount+1;
            }
            console.log("sectionQuantity++++-",sectionQuantityCout);

           
           

          }
          if (sectionQuantityCout >= sectionQuantity){  
            console.log("sectionQuantity++++-break",sectionQuantityCout);
            tmpFlagForCheck=false

            break;
          }
        }


        
      
        // Stop outer loop if limit reached
        if (sectionQuantityCout >= sectionQuantity){
          tmpFlagForCheck=false
          console.log("collection sectionConditionCount++++",sectionConditionCount);

          break;
        } 
      }
      console.log("sectionConditionCountggggjjjjg++++",sectionConditionCount);
      console.log("sectionQuantity fffffjjjf++++",sectionQuantity);

     
     
      
    }

    if (sectionConditionCount < sectionQuantity) {
      console.log("innnn  fffffjjjf++++",sectionQuantity);
      emptyDiscout=true;
  
    }
    
  });
  if(tmpFlagForCheck==false){
    nextStepsPossible=false;
  }
}




 

console.log("targets++++",JSON.stringify(targets));

  console.log("targetsAmout++++",JSON.stringify(targetsAmout));


  console.log("sectionConditionCount++++",sectionConditionCount);

  console.log("allSections.length++++",allSections.length);

  if (Array.isArray(allSections)) {
    console.log("allSections.length",allSections.length);
  
      if (sectionConditionCount < allSections.length) {
        // return EMPTY_DISCOUNT; 
    
      }
  
    }
    

  if(emptyDiscout){
    return EMPTY_DISCOUNT;

  }
 

  

  // console.log("CartSimple before targetCart", JSON.stringify({
  //   discounts: [
  //     {
  //       targets,
  //       message: title,
  //       value: {
  //         fixedAmount: {
  //           amount: 100
  //         }
  //       }
  //     }
  //   ],
  //   discountApplicationStrategy: DiscountApplicationStrategy.First
  // }));

  if(discountType=='PER'){

    return{
      discounts: [
        {
          targets,
          message: title,
          value: {
            percentage: {
              value: discount_value
            }
          }
        }
      ],
      discountApplicationStrategy: DiscountApplicationStrategy.All
    };
     
  }
  else if(discountType=='FIX' || discountType=='SET'){
var fixedAmount=discount_value;
console.log("discount_value", discount_value);

    if(discountType=='SET'){
      var avalibleSection=totalSteps/allSections.length;

     var  pricePerBundle=parseFloat(discount_value)*avalibleSection;
     console.log("pricePerBundle", pricePerBundle);

     fixedAmount = targetsAmout -pricePerBundle;

     if(targetsAmout<pricePerBundle){
      return EMPTY_DISCOUNT;
    
    }


    // fixedAmount=fixedAmount*avalibleSection;


    }
    else{


      console.log("targetsAmoutQty", targetsAmoutQty);

      // fixedAmount=targetsAmoutQty*fixedAmount;
      // var avalibleSection=sectionConditionCount;
      // console.log("avalibleSection", avalibleSection);

      // fixedAmount=fixedAmount*avalibleSection;

      const discounts = targets.map(t => {
        const qty = t.cartLine.quantity;
        const discountAmount = fixedAmount*qty
    
        return {
          targets: [t],
          message: title,
          value: {
            fixedAmount: {
              amount: discountAmount
            }
          }
        };
      });

      return{
        discounts: discounts,
        discountApplicationStrategy: DiscountApplicationStrategy.All
      };
    


    }

    return{
      discounts: [
        {
          targets,
          message: title,
          value: {
            fixedAmount: {
              amount: fixedAmount
            }
          }
        }
      ],
      discountApplicationStrategy: DiscountApplicationStrategy.All
    };
  }
  
  


  
  // console.log("CartSimple before targetCart", JSON.stringify(targets));


  // Example of reducing quantity
  // reduceQty(CartSimple, "gid://shopify/ProductVariant/45797815353589", 2);
  // console.log("CartSimple after reduceQty", JSON.stringify(CartSimple));

  console.log("EMPTY_DISCOUNT+++---");  
  return EMPTY_DISCOUNT;
};

/**
 * Reduce the quantity of an item.
 * @param {Object} CartSimple - The cart object to be modified
 * @param {string} merchandiseId 
 * @param {number} qty 
 */
function reduceQty(CartSimple, merchandiseId, qty = 1) {
  if (!CartSimple[merchandiseId]) {
    console.log(`Item not found: ${merchandiseId}`);
    return;
  }

  const currentQty = CartSimple[merchandiseId].qty;
  CartSimple[merchandiseId].qty = Math.max(0, currentQty - qty);

  // console.log(`Reduced qty for ${merchandiseId} by ${qty}. New qty: ${CartSimple[merchandiseId].qty}`);
}
