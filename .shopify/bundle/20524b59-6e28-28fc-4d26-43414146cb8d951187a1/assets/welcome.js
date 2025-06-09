document.addEventListener("DOMContentLoaded", function () {
  // Add scroll event handler
  window.addEventListener('scroll', function () {
    if (window.scrollY > 0) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });
  {/* <div class="bundle-tabs"><ul>${stepHtml}</ul></div> */ }
  const SHOPIFY_DOMAIN = window.location.origin;
  const STOREFRONT_ACCESS_TOKEN = "bbc79c88d7251fb0a149805b66201c9f";
  //const STOREFRONT_ACCESS_TOKEN = "010689d6dda5f9e1523df6b62c926eae";
  const DEFAULT_IMAGE = "https://cdn.shopify.com/s/files/1/0714/6340/3765/files/snowboard_wax.png";
  const DEFAULT_COLLECTION_IMAGE = "https://dddemo.net/php/2025/sandip/bundleapp/cat.webp";

  const FRONT_API_ENDPOINT = "https://stopped-phentermine-xi-two.trycloudflare.com/";
  // const FRONT_API_ENDPOINT = "https://myanmar-rest-turning-responded.trycloudflare.com/";

  const MIXMATCH_ENDPOINT = `${FRONT_API_ENDPOINT}front/api/mixmatch`;
  const CART_SUCCESS_ENDPOINT = `${FRONT_API_ENDPOINT}front/api/autodiscount`;


  let currentStepIndex = 0;
  const selectedProductsByStep = {};
  const target = document.getElementById("welcome-block");
  let stepsData = [];
  let hasCollection = false;
  let averageqty = 0;
  let bundlesData = [];
  let selectedBundleId = null;

  const extractNumericId = (gid = "") => parseInt(gid.split("/").pop() || "0");


  function showLoading() {

    const loadingSection = document.querySelector('.loading-section');
    if (loadingSection) {
      loadingSection.style.display = 'flex';
    }
  }

  function hideLoading() {
    const loadingSection = document.querySelector('.loading-section');
    if (loadingSection) {
      loadingSection.style.display = 'none';
    }
  }

  const showError = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bundle-error-message';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h3>Bundle Error</h3>
        <p>${message}</p>
        <button class="error-close-btn">Close</button>
      </div>
    `;

    // Add close button functionality
    errorDiv.querySelector('.error-close-btn').addEventListener('click', () => {
      errorDiv.remove();
    });

    document.body.appendChild(errorDiv);
  };

  const showSuccess = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'bundle-success-message';
    successDiv.innerHTML = `
      <div class="success-content">
        <h3>Success!</h3>
        <p>${message}</p>
        <div class="success-buttons">
          <button class="success-close-btn">Close</button>
          <button class="success-cart-btn">Go to Cart</button>
        </div>
      </div>
    `;

    // Add close button functionality
    successDiv.querySelector('.success-close-btn').addEventListener('click', () => {
      successDiv.remove();
    });

    // Add go to cart button functionality
    successDiv.querySelector('.success-cart-btn').addEventListener('click', () => {
      window.location.href = '/cart';
    });

    document.body.appendChild(successDiv);
  };

  const clearAllSelections = () => {
    // Clear selected products
    Object.keys(selectedProductsByStep).forEach(step => {
      selectedProductsByStep[step] = [];
    });

    // Reset current step
    currentStepIndex = 0;

    // Reset selected bundle
    //selectedBundleId = null;

    // Re-render the steps
    renderSteps();
  };

  const removeFromCart = async (variantId, quantityToRemove) => {
    try {
      // First get the cart to find the line ID
      const cartResponse = await fetch(`${SHOPIFY_DOMAIN}/cart.js`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!cartResponse.ok) {
        throw new Error(`Failed to get cart: ${cartResponse.status}`);
      }

      const cart = await cartResponse.json();

      // Find the line item with matching variant ID
      const lineItem = cart.items.find(item => item.variant_id == variantId);

      if (!lineItem) {
        console.log("Item not found in cart");
        return;
      }

      // Calculate new quantity (current quantity minus quantity to remove)
      const newQuantity = Math.max(0, lineItem.quantity - quantityToRemove);

      // Remove the item using its line number (1-based index)
      const lineNumber = cart.items.findIndex(item => item.variant_id == variantId) + 1;

      const removeResponse = await fetch(`${SHOPIFY_DOMAIN}/cart/change.js`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          line: lineNumber, // Use 1-based line number
          quantity: newQuantity
        })
      });

      if (!removeResponse.ok) {
        const errorData = await removeResponse.json();
        throw new Error(`Failed to remove item from cart: ${errorData.message || removeResponse.status}`);
      }

      return await removeResponse.json();
    } catch (err) {
      console.error("Failed to remove from cart", err);
      throw err;
    }
  };

  const getUrlParameter = (name) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  };

  const updateUrlWithBundle = (bundleId) => {
    const url = new URL(window.location);
    if (bundleId) {
      url.searchParams.set('bundle', bundleId);
    } else {
      url.searchParams.delete('bundle');
    }
    window.history.pushState({}, '', url);
  };

  const renderBundlesList = () => {


    if (!target) return;

    if (!bundlesData || bundlesData.length === 0) {
      target.innerHTML = `
        <div class="no-bundles-message">
          <h3>No Bundles Found</h3>
          <p>There are currently no bundles available.</p>
        </div>
      `;
      return;
    }

    const bundlesHtml = bundlesData.map(bundle => `
      <div class="bundle-card" data-bundle-id="${bundle.id}">
        <div class="bundle-card-media">
          ${bundle?.media
        ? `<img src="${bundle.media}" alt="${bundle.title || ''}">`
        : `<div class="bundle-card-placeholder">No Image</div>`
      }
        </div>
        <div class="bundle-card-content">
          <h3>${bundle.title || ''}</h3>
          ${bundle.short_description
        ? `<div class="bundle-discount">${bundle.short_description}</div>`
        : ''
      }
        </div>
      </div>
    `).join("");

    target.innerHTML = `
      <div class="bundles-list">
        <h2>Available Bundles</h2>
        <div class="bundles-grid">
          ${bundlesHtml}
        </div>
      </div>
    `;

    // Add click handlers for bundle cards
    document.querySelectorAll('.bundle-card').forEach(card => {
      card.addEventListener('click', async () => {
        const bundleId = card.getAttribute('data-bundle-id');
        selectedBundleId = bundleId;
        updateUrlWithBundle(bundleId);
        const selectedBundle = bundlesData.find(b => b.id === bundleId);
        if (selectedBundle) {
          const apiSections = selectedBundle.sections || [];

          stepsData = await Promise.all(apiSections.map(async (section, index) => {
            const stepType = section.requirement || "minQuantity";
            let products = [];

            if (section.type === "collection") {
              const collectionId = extractNumericId(section.items?.[0]?.id);
              if (collectionId) products = await fetchProductsByCollection(collectionId);
            } else {
              products = (section.items || []).map(item => ({
                id: extractNumericId(item.id),
                variantsid: extractNumericId(item.variants?.[0]?.id),
                title: item.title || "No Title Found",
                
                images: (
                  // Check for variant image first
                  item.variants?.[0]?.image?.originalSrc ||
                  // Then check for product image
                  item?.images?.[0]?.originalSrc ||
                  // Fallback to DEFAULT_IMAGE
                  DEFAULT_IMAGE
                 ),
                price: item.price || "$0.00",
                description: section.description || ""
              }));
            }

            return {
              step: section.sectionName || `Step ${index + 1}`,
              Image: section.items[0].image?.originalSrc || DEFAULT_COLLECTION_IMAGE,
              quantity: parseInt(section.quantity || "0", 10),
              minqty: parseInt(section.minquantity || "0", 10),
              minrange: parseInt(section.minquantity || "0", 10),
              maxrange: parseInt(section.maxquantity || "99", 10),
              type: stepType,
              iscollection: section.type === "collection" ? true : false,
              products
            };
          }));

          renderSteps();
        }
      });
    });
  };

  const isStepValid = (stepIndex) => {
    if (hasCollection) {
      // For collections, check total quantity across all collections
      let totalQty = 0;
      Object.values(selectedProductsByStep).forEach(products => {
        totalQty += products.reduce((sum, product) => sum + (product.quantity || 1), 0);
      });
      return totalQty >= averageqty;
    } else {
      // Original behavior for non-collection mode
      const selected = selectedProductsByStep[stepIndex] || [];
      const { minqty, minrange, maxrange, type, quantity } = stepsData[stepIndex];

      // Calculate total quantity for this step
      const totalQty = selected.reduce((sum, item) => sum + (item.quantity || 1), 0);

      return type === "minQuantity" ? totalQty >= minqty :
        type === "rangeQuantity" ? totalQty >= minrange && totalQty <= maxrange :
          type === "exactQuantity" ? totalQty >= quantity : false;
    }
  };

  const getNextInvalidStep = () => {
    for (let i = 0; i < stepsData.length; i++) {
      if (!isStepValid(i)) {
        return i;
      }
    }
    return 0; // If all steps are valid, return to first step
  };

  const areAllStepsValid = () => stepsData.every((_, i) => isStepValid(i));

  const renderPreview = () => {
    let circleindex = 1;
    let foundActive = false; // Track if we've found the first empty box

    if (hasCollection) {
      // For collections, show only averageqty boxes without collection titles
      const circles = Array(averageqty).fill().map((_, index) => {
        // Find the product for this position across all collections
        let product = null;
        let productIndex = 0;
        let currentQty = 0;
        
        // Check all collections for selected products
        Object.values(selectedProductsByStep).forEach(products => {
          for (let i = 0; i < products.length; i++) {
            currentQty += products[i].quantity || 1;
            if (currentQty > index) {
              product = products[i];
              productIndex = i;
              break;
            }
          }
        });

        const isFilled = !!product;
        const currentIndex = circleindex++;
        const isActive = !isFilled && !foundActive;
        if (isActive) foundActive = true;
        
        return `
          <div class="bundle-perfume-box ${isActive ? 'active' : ''}">
            <div class="bundle-perfume-box-img">
              ${isFilled ? `
                <img src="${product.images}" alt="" style="height:45px; width:45px;">
                <div class="bundle-quantity">${index + 1}</div>
                <div class="bundle-close" data-step="${product.stepIndex}" data-variant="${product.variantsid}" data-index="${productIndex}">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <circle cx="8.5" cy="8.5" r="8" fill="#D10000" />
                    <path d="M5.5 5.5L11.5 11.5M11.5 5.5L5.5 11.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
              ` : `
                <div class="blank-circle">${currentIndex}</div>
              `}
            </div>
            <span class="bundle-item"><p>Select Your</p><h3>Item ${currentIndex}</h3> </span>
          </div>
        `;
      }).join('');

      return `
        <div class="bundle-perfume-tab bundle-stroke">
          <div class="bundle-perfume-boxes">${circles}</div>
        </div>
      `;
    } else {
      // Original behavior for non-collection mode
      return stepsData.map((step, stepKey) => {
        const { minqty, minrange, maxrange, type, quantity } = step;
        const requiredQty = type === "minQuantity" ? minqty :
          type === "rangeQuantity" ? minqty :
            type === "exactQuantity" ? quantity : 0;

        const selected = selectedProductsByStep[stepKey] || [];
        // Create circles for required quantity
        const circles = Array(requiredQty).fill().map((_, index) => {
          // Find the product for this position
          let product = null;
          let productIndex = 0;
          let currentQty = 0;
          
          for (let i = 0; i < selected.length; i++) {
            currentQty += selected[i].quantity || 1;
            if (currentQty > index) {
              product = selected[i];
              productIndex = i;
              break;
            }
          }

          const isFilled = !!product;
          const currentIndex = circleindex++;
          const isActive = !isFilled && !foundActive;
          if (isActive) foundActive = true;
          
          return `
            <div class="bundle-perfume-box ${isActive ? 'active' : ''}">
              <div class="bundle-perfume-box-img">
                ${isFilled ? `
                  <img src="${product.images}" alt="" style="height:45px; width:45px;">
                  <div class="bundle-quantity">${index + 1}</div>
                  <div class="bundle-close" data-step="${stepKey}" data-variant="${product.variantsid}" data-index="${productIndex}">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                      <circle cx="8.5" cy="8.5" r="8" fill="#D10000" />
                      <path d="M5.5 5.5L11.5 11.5M11.5 5.5L5.5 11.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </div>
                ` : `
                  <div class="blank-circle">${currentIndex}</div>
                `}
              </div>
              <span class="bundle-item"><p>Select Your</p><h3>Item ${currentIndex}</h3> </span>
            </div>
          `;
        }).join('');

        return `
          <div class="bundle-perfume-tab bundle-stroke">
            <div class="bundle-perfume-title"><span> <svg style="vertical-align : middle; margin-right :10px;" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8.5" cy="8.5" r="8" fill="#00A651"/>
    <path d="M5 8.5L7.5 11L12 6.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>${step.step}</span></div>
            <div class="bundle-perfume-boxes">${circles}</div>
          </div>
        `;
      }).join("");
    }
  };

  const renderPreviewmobile = () => {
    let circleindex = 1;
    let foundActive = false;

    if (hasCollection) {
      // For collection mode, show only averageqty boxes
      const circles = Array(averageqty).fill().map((_, index) => {
        // Find the product for this position across all collections
        let product = null;
        let productIndex = 0;
        let currentQty = 0;
        let foundStep = null;
        
        // Check all collections for selected products
        Object.entries(selectedProductsByStep).forEach(([stepIndex, products]) => {
          for (let i = 0; i < products.length; i++) {
            currentQty += products[i].quantity || 1;
            if (currentQty > index) {
              product = products[i];
              productIndex = i;
              foundStep = stepIndex;
              break;
            }
          }
        });

        const isFilled = !!product;
        const currentIndex = circleindex++;
        const isActive = !isFilled && !foundActive;
        if (isActive) foundActive = true;
        
        return `
          <div class="bundle-perfume-box ${isActive ? 'active' : ''}">
            <div class="bundle-perfume-box-img">
              ${isFilled ? `
                <img src="${product.images}" alt="" style="height:45px; width:45px;">
                <div class="bundle-quantity">${index + 1}</div>
                <div class="bundle-close" data-step="${foundStep}" data-variant="${product.variantsid}" data-index="${productIndex}">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <circle cx="8.5" cy="8.5" r="8" fill="#D10000" />
                    <path d="M5.5 5.5L11.5 11.5M11.5 5.5L5.5 11.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
              ` : `
                <div class="blank-circle">Item ${currentIndex}</div>
              `}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="bundle-perfume-tab bundle-stroke">
          <div class="bundle-perfume-boxes">${circles}</div>
        </div>
      `;
    }

    // Original non-collection mode code
    return stepsData.map((step, stepKey) => {
      const { minqty, minrange, maxrange, type, quantity } = step;
      const requiredQty = type === "minQuantity" ? minqty :
        type === "rangeQuantity" ? minqty :
        type === "exactQuantity" ? quantity : 0;

      const selected = selectedProductsByStep[stepKey] || [];
      // Create circles for required quantity
      const circles = Array(requiredQty).fill().map((_, index) => {
        // Find the product for this position
        let product = null;
        let productIndex = 0;
        let currentQty = 0;
        
        for (let i = 0; i < selected.length; i++) {
          currentQty += selected[i].quantity || 1;
          if (currentQty > index) {
            product = selected[i];
            productIndex = i;
            break;
          }
        }

        const isFilled = !!product;
        const currentIndex = circleindex++;
        const isActive = !isFilled && !foundActive;
        if (isActive) foundActive = true;
        
        return `
          <div class="bundle-perfume-box ${isActive ? 'active' : ''}">
            <div class="bundle-perfume-box-img">
              ${isFilled ? `
                <img src="${product.images}" alt="" style="height:45px; width:45px;">
                <div class="bundle-quantity">${index + 1}</div>
                <div class="bundle-close" data-step="${stepKey}" data-variant="${product.variantsid}" data-index="${productIndex}">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <circle cx="8.5" cy="8.5" r="8" fill="#D10000" />
                    <path d="M5.5 5.5L11.5 11.5M11.5 5.5L5.5 11.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
              ` : `
                <div class="blank-circle">Item ${currentIndex}</div>
              `}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="bundle-perfume-tab bundle-stroke">
          <div class="bundle-perfume-boxes">${circles}</div>
        </div>
      `;
    }).join("");
  };

 


  const getDiscountText = (bundle) => {
    if (!bundle) return "";

    const { discount_type, discount_value } = bundle;

    switch (discount_type) {
      case "PER":
        return `${discount_value}% OFF`;
      case "FIX":
        return `₹ ${discount_value} OFF`;
      case "SET":
        return `₹ ${discount_value}`;
      default:
        return "";
    }
  };

  const getDiscount = (bundle) => {
    if (!bundle) return "";

    const { discount_type, discount_value } = bundle;

    switch (discount_type) {
      case "PER":
        return `${discount_value}`;
      case "FIX":
        return `${discount_value}`;
      case "SET":
        return `${discount_value}`;
      default:
        return "";
    }
  };

  const getDiscountValue = (bundle) => {
    if (!bundle) return 0;
    const { discount_type, discount_value } = bundle;
    if (discount_type === "PER") {
      return (totalPrice * discount_value) / 100;
    }
    return parseFloat(discount_value) || 0;
  };

  const calculateProgress = () => {
   
    if (hasCollection) {
      // For collection mode, calculate progress based on total quantity vs averageqty
      let totalSelectedQty = 0;
      Object.values(selectedProductsByStep).forEach(products => {
        totalSelectedQty += products.reduce((sum, product) => sum + (product.quantity || 1), 0);
      });
      
      // Calculate percentage based on averageqty
      return Math.min(Math.round((totalSelectedQty / averageqty) * 100), 100);
    } else {
      // Original behavior for non-collection mode
      let totalProducts = 0;
      let addedProducts = 0;

      // Calculate total required products and currently added products
      stepsData.forEach((step, stepIndex) => {
        const { minqty, minrange, maxrange, type, quantity } = step;
        const requiredQty = type === "minQuantity" ? minqty :
          type === "rangeQuantity" ? minqty :
          type === "exactQuantity" ? quantity : 0;

        totalProducts += requiredQty;

        const selected = selectedProductsByStep[stepIndex] || [];
        addedProducts += selected.reduce((sum, product) => sum + (product.quantity || 1), 0);
      });

      // Calculate percentage (ensure it doesn't exceed 100%)
      return Math.min(Math.round((addedProducts / totalProducts) * 100), 100);
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;
    Object.values(selectedProductsByStep).forEach(products => {
      products.forEach(product => {
        const price = parseFloat(product.price.replace(/[^0-9.-]+/g, "")) || 0;
        const quantity = product.quantity || 1;
        total += price * quantity;
      });
    });
    return total;
  };


 
  const renderSteps = (number = 0) => {
    
    hasCollection = stepsData.some(item => item.iscollection === true);
    if(currentStepIndex === -1){
      if (!target || !stepsData[currentStepIndex + 1]) return;
    }else{
      if (!target || !stepsData[currentStepIndex]) return;
    }
   
    
    const currentBundle = bundlesData.find(b => b.id === selectedBundleId);
    averageqty = currentBundle.AverageQty;
   
    const bundleTitle = currentBundle?.title || "Custom Bundle";
    const totalPrice = calculateTotalPrice();

    const discountText = getDiscountText(currentBundle);
   

    // Get current step's requirements
   
    const { minqty, minrange, maxrange, type, quantity } = (currentStepIndex === -1 ? stepsData[currentStepIndex + 1] : stepsData[currentStepIndex]);
   
   
    // Calculate total selected quantity across all collections
    let totalSelectedQty = 0;
    if (hasCollection) {
      Object.values(selectedProductsByStep).forEach(products => {
        totalSelectedQty += products.reduce((sum, product) => sum + (product.quantity || 1), 0);
      });
    } else {
      const selectedProducts = selectedProductsByStep[currentStepIndex] || [];
      totalSelectedQty = selectedProducts.reduce((sum, product) => sum + (product.quantity || 1), 0);
    }
   
    // Determine if we've reached the maximum allowed quantity
    let maxAllowedQty;
    if (hasCollection) {
      maxAllowedQty = averageqty;
    } else {
      maxAllowedQty = type === "minQuantity" ? minqty :
        type === "rangeQuantity" ? minqty :
        type === "exactQuantity" ? quantity : 0;
    }

    const isMaxQtyReached = totalSelectedQty >= maxAllowedQty;

    // Check if all steps are valid (progress is 100%)
    const isAllStepsValid = hasCollection ? 
      totalSelectedQty >= averageqty : 
      areAllStepsValid();
      
     let productHtml = '';
    
     if (currentStepIndex == -1) {
      productHtml = stepsData.map((step, stepIndex) => {
        return step.products.map(product => {
          // Check if this product is already selected
          let isSelected = false;
          let selectedProduct = null;
          let productQty = 0;
    
          if (hasCollection) {
            // For collections, check across all steps
            Object.values(selectedProductsByStep).forEach(products => {
              const found = products.find(p => p.variantsid === product.variantsid);
              if (found) {
                isSelected = true;
                selectedProduct = found;
                productQty += found.quantity || 1;
              }
            });
          } else {
            // For non-collection mode, check only current step
            const selected = selectedProductsByStep[currentStepIndex] || [];
            isSelected = selected.some(p => p.variantsid === product.variantsid);
            selectedProduct = selected.find(p => p.variantsid === product.variantsid);
            productQty = selectedProduct ? selectedProduct.quantity : 0;
          }
    
          // For collection mode, disable all products if max quantity reached
          const shouldDisable = hasCollection ? isMaxQtyReached && !isSelected : isMaxQtyReached && !isSelected;
    
          return `
            <li>
              <div class="bundle-collection-img">
                <img src="${product.images}" alt="${product.title}">
              </div>
              <h5>${product.title}</h5>
              <div class="bundle-rating">
                <div class="bundle-star"><span>${product.price}</span></div>
              </div>
              <div class="bundle-add-to-box-btn">
                <a href="#"
                  class="add-to-box ${shouldDisable ? 'disabled' : ''} add-to-box-btn ${isSelected ? 'selected' : ''}"
                  data-step="${stepIndex}"
                  data-variant="${product.variantsid}"
                  style="pointer-events: ${shouldDisable ? 'none' : 'auto'}; opacity: ${shouldDisable ? '0.5' : '1'}">
                  ${isSelected ? `Added (${productQty})` : 'Add to Box'}
                </a>
              </div>
            </li>
          `;
        }).join("");
      }).join(""); // Join for all steps
    }else{
      productHtml = stepsData[currentStepIndex].products.map(product => {
        // Check if this product is already selected
        let isSelected = false;
        let selectedProduct = null;
        let productQty = 0;
  
        if (hasCollection) {
          // For collections, check across all steps
          Object.values(selectedProductsByStep).forEach(products => {
            const found = products.find(p => p.variantsid === product.variantsid);
            if (found) {
              isSelected = true;
              selectedProduct = found;
              productQty += found.quantity || 1;
            }
          });
        } else {
          // For non-collection mode, check only current step
          const selected = selectedProductsByStep[currentStepIndex] || [];
          isSelected = selected.some(p => p.variantsid === product.variantsid);
          selectedProduct = selected.find(p => p.variantsid === product.variantsid);
          productQty = selectedProduct ? selectedProduct.quantity : 0;
        }
  
        // For collection mode, disable all products if max quantity reached
        const shouldDisable = hasCollection ? isMaxQtyReached && !isSelected : isMaxQtyReached && !isSelected;
  
        return `
          <li>
            <div class="bundle-collection-img">
              <img src="${product.images}" alt="">
            </div>
            <h5>${product.title}</h5>
            <div class="bundle-rating">
              <div class="bundle-star"><span>${product.price}</span></div>
            </div>
            <div class="bundle-add-to-box-btn">
              <a href="#" class="add-to-box ${shouldDisable ? 'disabled' : ''} add-to-box-btn ${isSelected ? 'selected' : ''}"
                 data-step="${currentStepIndex}"
                 data-variant="${product.variantsid}"
                 style="pointer-events: ${shouldDisable ? 'none' : 'auto'};
                        opacity: ${shouldDisable ? '0.5' : '1'}">
                ${isSelected ? `Added (${productQty})` : 'Add to Box'}
              </a>
            </div>
          </li>
        `;
      }).join("");
    }
    
    

   

    const progressWidth = calculateProgress();
   
  


    
    target.innerHTML = `
       ${hasCollection ? `
       <div class="bundle-sidebar">
          <ul>
           <li class="${currentStepIndex === -1 ? 'active' : ''}" data-step-index="-1">
            <div class="bundle-sidebar-img">
              <img src="${DEFAULT_COLLECTION_IMAGE}" alt="All Products">
            </div>
            <h5>All Products</h5>
          </li>
  
            ${stepsData.map((step, index) => {
                return step.iscollection === true ? `
                  <li class="${index === currentStepIndex ? 'active' : ''}" data-step-index="${index}">
                      <div class="bundle-sidebar-img">
                          <img src="${step.Image}" alt="${step.step}">
                      </div>
                      <h5>${step.step}</h5>
                  </li>
                ` : '';
              }).join('')}
        </ul>
    </div>
       ` : ''}
       
       ${hasCollection ? `
        <div class="bundle-sidebar mobile-sidebar">
         
          <div class="mobile-sidebar-content">
            <ul>
              <li class="${currentStepIndex === -1 ? 'active' : ''}" data-step-index="-1">
                <div class="bundle-sidebar-img">
                  <img src="${DEFAULT_COLLECTION_IMAGE}" alt="All Products">
                </div>
                <h5>All Products</h5>
              </li>
              ${stepsData.map((step, index) => {
                return step.iscollection === true ? `
                  <li class="${index === currentStepIndex ? 'active' : ''}" data-step-index="${index}">
                      <div class="bundle-sidebar-img">
                          <img src="${step.Image}" alt="${step.step}">
                      </div>
                      <h5>${step.step}</h5>
                  </li>
                ` : '';
              }).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

      <section class="bundle-price">
       
        <div class="bundle-img-animation ${progressWidth === 100 &&  number === 0 ? 'active' : ''}"></div>

        <div class="bundle-sticky-mobile-tab">
          <div class="container">
            <div class="bundle-price-row">
                <div class="bundle-inner-row">
                <div class="bundle-filter">
                  <div class="bundle-product-name">
                    <h5>${bundleTitle}</h5>
                  </div>
                  <div class="mobile-sidebar-toggle">
                      <button class="toggle-btn">
                        <span class="toggle-text">Filter</span>
                      </button>
                  </div>
                  </div>
                  <div class="bundle-price-tag">
                    ${discountText ? `<div class="bundle-discount">${discountText}</div>` : ''}
                  </div>
                </div>
            </div>

            <div class="bundle-progress-bar">
              <div class="bundle-progress" style="width: ${progressWidth}%;">

              </div>
            </div>

            <div class="bundle-tab-content preview-desktop">
                <div class="bundle-tab-content-row">
                  <div class="bundle-inner-content-row">
                    ${renderPreview()}
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div class="bundle-colection-list">
          <div class="container">
            <div class="bundle-colection-title">
              <h4>parfums</h4>
            </div>
            <div class="bundle-inner-collection-list">
              <ul>
                ${productHtml}
              </ul>
            </div>
          </div>
        </div>

        <div id="loading-text" style="display: none;">Adding items to cart...</div>
        <div class="bundle-full-w-btn">
        <div class="bundle-tab-content preview-mobile">
                <div class="bundle-tab-content-row">
                  <div class="bundle-inner-content-row">
                    ${renderPreviewmobile()}
                  </div>
                </div>
            </div>
           <div class="container">
             
             <div class="bundle-bottom-row">
               <div class="bundle-bottom-row-left">
                  <div class="bundle-price-row">
                      <div class="bundle-inner-row">
                        <div class="bundle-product-name">
                          <h5>${bundleTitle}</h5>
                        </div>
                       
                      </div>
                  </div>  
                  <div class="bundle-bottom-progress-bar">
                        <div class="bundle-progress-bar">
                            <div class="bundle-progress" style="width: ${progressWidth}%;">

                            </div>
                        </div>
                  </div>
                </div>
                <div class="bundle-bottom-addtocart">
                       <div class="bundle-price-row">
                          <div class="price-section">
                           <span>Total ${discountText}/-</span>
                           ${
                            isAllStepsValid && (totalPrice - getDiscountValue(currentBundle)) > 0
                              ? `<span class="bybMrpPrices">MRP ₹ ${totalPrice.toFixed(2)}/-</span>`
                              : ''
                            }
                         </div>
                         ${
                          isAllStepsValid && (totalPrice - getDiscountValue(currentBundle)) > 0
                            ? `<span class="price_green">Save ₹ ${(totalPrice - getDiscountValue(currentBundle)).toFixed(2)}</span>`
                            : ''
                          }
                           
                       </div>
                        <a href="#"
                          class="add-to-cart-btn ${isAllStepsValid ? '' : 'disabled'}"
                          style="pointer-events: ${isAllStepsValid ? 'auto' : 'none'};">
                          Add to Cart
                        </a>
                </div>
                
              </div>
              
          </div>
        </div>
      </section>
    `;

    // If progress is 100%, remove active class after 2 seconds
    if (progressWidth == 100) {
      setTimeout(() => {
        const animationElement = document.querySelector('.bundle-img-animation');
        if (animationElement) {
          animationElement.classList.remove('active');
        }
      }, 2000);
    }

    // Add mobile sidebar toggle functionality
    const toggleBtn = document.querySelector('.toggle-btn');
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    
    if (toggleBtn && mobileSidebar) {
      toggleBtn.addEventListener('click', () => {
        mobileSidebar.classList.toggle('active');
        const isActive = mobileSidebar.classList.contains('active');
        toggleBtn.querySelector('.toggle-text').textContent = isActive ? 'Filter' : 'Filter';
      });

      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if (!mobileSidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
          mobileSidebar.classList.remove('active');
          toggleBtn.querySelector('.toggle-text').textContent = 'Filter';
        }
      });
    }

    // Add collection selection event listeners
    let sidemenuclick = 0;
    document.querySelectorAll('.bundle-sidebar li').forEach(li => {
      li.addEventListener('click', () => {
       
        const stepIndex = parseInt(li.getAttribute('data-step-index'));
        if (stepIndex !== currentStepIndex) {
          currentStepIndex = stepIndex;
          // Close mobile sidebar after selection
          if (mobileSidebar) {
            mobileSidebar.classList.remove('active');
            toggleBtn.querySelector('.toggle-text').textContent = 'Categories';
          }
          const progressWidth = calculateProgress();
          if (progressWidth === 100) {
            sidemenuclick = sidemenuclick + 1; // ✅ Now this will work
          }
          renderSteps(sidemenuclick);
        }
        
      });
    });

    attachEvents();
  };

  const attachEvents = () => {
    document.querySelectorAll(".step-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const targetIndex = parseInt(tab.getAttribute("data-index"));
        if (targetIndex === currentStepIndex) return;

        if (targetIndex > currentStepIndex && isStepValid(currentStepIndex) ||
          targetIndex < currentStepIndex && isStepValid(targetIndex)) {
          currentStepIndex = targetIndex;
          renderSteps();
        }
      });
    });

    document.querySelectorAll(".bundle-close").forEach(btn => {
      btn.addEventListener("click", () => {
        const stepKey = btn.getAttribute("data-step");
        const variantId = parseInt(btn.getAttribute("data-variant"));
        const index = parseInt(btn.getAttribute("data-index"));

        if (hasCollection) {
          // For collection mode, find the product across all steps
          let foundStep = null;
          let foundIndex = -1;
          
          // Search through all steps to find the product
          Object.entries(selectedProductsByStep).forEach(([stepIndex, products]) => {
            const productIndex = products.findIndex(p => p.variantsid === variantId);
            if (productIndex !== -1) {
              foundStep = stepIndex;
              foundIndex = productIndex;
            }
          });

          if (foundStep !== null && foundIndex !== -1) {
            const selected = selectedProductsByStep[foundStep];
            const product = selected[foundIndex];

            // Remove only the last added quantity
            if (product.quantity > 1) {
              product.quantity--;
            } else {
              // If this was the last quantity, remove the product entry
              selectedProductsByStep[foundStep] = selected.filter((_, i) => i !== foundIndex);
            }
          }
        } else {
          // Original behavior for non-collection mode
          const selected = selectedProductsByStep[stepKey];
          const product = selected[index];

          // Remove only the last added quantity
          if (product.quantity > 1) {
            product.quantity--;
          } else {
            // If this was the last quantity, remove the product entry
            selectedProductsByStep[stepKey] = selected.filter((_, i) => i !== index);
          }
        }

        // Update current step if needed
        currentStepIndex = getNextInvalidStep();

        // Re-render the steps
        renderSteps();
      });
    });

    document.querySelectorAll(".add-to-box").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();

        // Check if button is disabled
        if (btn.classList.contains('disabled')) {
          return;
        }

        const stepIndex = parseInt(btn.getAttribute("data-step"));
        const variantId = parseInt(btn.getAttribute("data-variant"));
        const product = stepsData[stepIndex].products.find(p => p.variantsid === variantId);

        if (!product) return;

        if (hasCollection) {
          // For collection mode, check total quantity across all steps
          let totalSelectedQty = 0;
          Object.values(selectedProductsByStep).forEach(products => {
            totalSelectedQty += products.reduce((sum, product) => sum + (product.quantity || 1), 0);
          });

          // Check if adding would exceed the maximum allowed quantity
          if (totalSelectedQty >= averageqty) {
            return;
          }

          // Add product to current step
          const selected = selectedProductsByStep[stepIndex] || [];
          const existingProduct = selected.find(p => p.variantsid === variantId);

          if (existingProduct) {
            existingProduct.quantity = (existingProduct.quantity || 1) + 1;
          } else {
            product.quantity = 1;
            selected.push(product);
          }

          selectedProductsByStep[stepIndex] = selected;
        } else {
          // Original behavior for non-collection mode
          const selected = selectedProductsByStep[stepIndex] || [];
          const existingProduct = selected.find(p => p.variantsid === variantId);

          // Get current step's requirements
          const { minqty, minrange, maxrange, type, quantity } = stepsData[stepIndex];
          const maxAllowedQty = type === "minQuantity" ? minqty :
            type === "rangeQuantity" ? minqty :
            type === "exactQuantity" ? quantity : 0;

          // Calculate current total quantity
          const currentTotalQty = selected.reduce((sum, p) => sum + (p.quantity || 1), 0);

          // Check if adding would exceed the maximum
          if (currentTotalQty >= maxAllowedQty) {
            return;
          }

          if (existingProduct) {
            existingProduct.quantity = (existingProduct.quantity || 1) + 1;
          } else {
            product.quantity = 1;
            selected.push(product);
          }

          selectedProductsByStep[stepIndex] = selected;

          if (isStepValid(stepIndex) && stepIndex === currentStepIndex && currentStepIndex < stepsData.length - 1) {
            currentStepIndex++;
          }
        }

        renderSteps();
      });
    });

    const addToCartBtn = document.querySelector(".add-to-cart-btn");
    const loadingText = document.getElementById("loading-text");

    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", async e => {
        e.preventDefault();
        if (!areAllStepsValid()) return;

        addToCartBtn.textContent = "Adding...";
        addToCartBtn.style.pointerEvents = "none";
        loadingText.style.display = "block";

        const currentBundle = bundlesData.find(b => b.id === selectedBundleId);
        const bundleName = currentBundle?.title || "Custom Bundle";
        let addedItems = [];
        let failedItems = [];
        let hasError = false;

        try {
          for (const [stepIndex, products] of Object.entries(selectedProductsByStep)) {
            for (const product of products) {
              try {
                const variantId = product.variantsid.toString();
                const quantity = product.quantity || 1;

                const response = await fetch(`${SHOPIFY_DOMAIN}/cart/add.js`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                  },
                  body: JSON.stringify({
                    id: variantId,
                    quantity: quantity,
                    properties: {
                      'Bundle Name': bundleName
                    }
                  })
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(`Failed to add product ${product.title} to cart: ${errorData.message || response.status}`);
                }

                const result = await response.json();

                addedItems.push({
                  variantId: variantId,
                  title: product.title,
                  price: product.price,
                  step: stepIndex,
                  quantity: quantity
                });
              } catch (err) {
                console.error("Add to cart failed", err);
                failedItems.push({
                  title: product.title,
                  step: stepIndex,
                  error: err.message
                });
                hasError = true;
                break;
              }
            }
            if (hasError) break;
          }

          if (hasError) {
            try {
              for (const item of addedItems) {
                await removeFromCart(item.variantId, item.quantity);
              }
            } catch (err) {
              console.error("Failed to clean up cart items", err);
            }

            let errorMessage = "The following products could not be added to your cart:\n\n";
            failedItems.forEach(item => {
              errorMessage += `• Step ${parseInt(item.step) + 1}: ${item.title}\n`;
              if (item.error) {
                errorMessage += `  ${item.error}\n`;
              }
            });
            errorMessage += "\nAll added items have been removed from the cart. Please try again.";

            showError(errorMessage);
            return;
          }

          // If all items were added successfully, send bundle data to API
          if (areAllStepsValid()) {
            try {
              const currentBundle = bundlesData.find(b => b.id === selectedBundleId);
              const discountValue = parseFloat(getDiscount(currentBundle));
              const totalPrice = addedItems.reduce((sum, item) => {
                return sum + (parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * item.quantity);
              }, 0);
              if (totalPrice >= discountValue) {
                
                await sendBundleDataToAPI(addedItems, selectedBundleId);
              }
              
             
              // loadingText.style.display = "none";
              // showSuccess("All items have been successfully added to your cart!");
              //handleFloCheckoutBtn();
              window.handleFloCartBtn();
              clearAllSelections();
            } catch (error) {
              console.error("Failed to send bundle data:", error);
              showError("Items added to cart, but failed to save bundle data. Please contact support.");
            }
          } else {
            try {
              for (const item of addedItems) {
                await removeFromCart(item.variantId, item.quantity);
              }
            } catch (err) {
              console.error("Failed to clean up cart items", err);
            }
            showError("Bundle is not complete. All items have been removed from the cart.");
          }
        } catch (error) {
          console.error("Bundle add to cart failed", error);
          for (const item of addedItems) {
            await removeFromCart(item.variantId, item.quantity);
          }
          showError("Failed to add bundle to cart. Please try again.");
        } finally {
          addToCartBtn.textContent = "add to cart";
          addToCartBtn.style.pointerEvents = "auto";
          loadingText.style.display = "none";
        }
      });
    }
  };

  async function fetchProductsByCollection(collectionId) {
    const query = `{
      collection(id: "gid://shopify/Collection/${collectionId}") {
        products(first: 10) {
          edges {
            node {
              id
              title
              images(first: 1) { edges { node { url } } }
              variants(first: 1) { edges { node { id price { amount currencyCode } } } }
            }
          }
        }
      }
    }`;

    const response = await fetch(`${SHOPIFY_DOMAIN}/api/2025-04/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    return result?.data?.collection?.products?.edges?.map(({ node }) => ({
      id: extractNumericId(node.id),
      variantsid: extractNumericId(node.variants.edges[0]?.node?.id),
      title: node.title,
      images: (
        // 1. Variant image (highest priority)
        node.variants.edges[0]?.node?.image?.originalSrc ||
        // 2. Product image
        node.images.edges[0]?.node?.url ||
        // 3. Default image (fallback)
        DEFAULT_IMAGE
      ),
      price: `${node.variants.edges[0]?.node?.price.amount || "0.00"} ${node.variants.edges[0]?.node?.price.currencyCode || ""}`,
      description: ""
    })) || [];
  }

  async function fetchStepsData() {
    showLoading();
    try {
      const response = await fetch(MIXMATCH_ENDPOINT, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      console.log("Bundles data:", result);

      bundlesData = result.data.map(bundle => ({
        id: bundle.id,
        title: bundle.title,
        media: bundle.media,
        discount_type: bundle.discount_type,
        discount_value: bundle.discount_value,
        sections: bundle.sections,
        AverageQty : bundle.totalqty,
        short_description: bundle.short_description,
      }));

      // Check for bundle ID in URL
      const bundleId = getUrlParameter('bundle');
      if (bundleId) {
        const selectedBundle = bundlesData.find(b => b.id === bundleId);
        if (selectedBundle) {
          selectedBundleId = bundleId;
          const apiSections = selectedBundle.sections || [];

          stepsData = await Promise.all(apiSections.map(async (section, index) => {
            
            
            const stepType = section.requirement || "minQuantity";
            let products = [];

            if (section.type === "collection") {
              const collectionId = extractNumericId(section.items?.[0]?.id);
              if (collectionId) products = await fetchProductsByCollection(collectionId);
            } else {
              products = (section.items || []).map(item => ({
                id: extractNumericId(item.id),
                variantsid: extractNumericId(item.variants?.[0]?.id),
                title: item.title || "No Title Found",
               images: (
                // 1. Variant image (highest priority)
                item.variants?.[0]?.image?.originalSrc ||
                // 2. Product image
                item?.images?.[0]?.originalSrc ||
                // 3. Default image (fallback)
                DEFAULT_IMAGE
             ),
                price: item.price || "$0.00",
                description: section.description || ""
              }));
            }

            return {
              step: section.sectionName || `Step ${index + 1}`,
              Image: section.items[0].image?.originalSrc || DEFAULT_COLLECTION_IMAGE,
              quantity: parseInt(section.quantity || "0", 10),
              minqty: parseInt(section.minquantity || "0", 10),
              minrange: parseInt(section.minquantity || "0", 10),
              maxrange: parseInt(section.maxquantity || "99", 10),
              type: stepType,
              iscollection: section.type === "collection" ? true : false,
              products
            };
          }));

          renderSteps();
        } else {
          renderBundlesList();
        }
      } else {
        renderBundlesList();
      }
    } catch (error) {
      console.error("Failed to fetch bundles data", error);
      if (target) target.innerHTML = `<p style="color: red;">Failed to load bundles. Please try again later.</p>`;
    } finally {
      hideLoading();
    }
  }

  if (target) fetchStepsData();
  else console.warn("welcome-block not found.");




  // Handle back button
  function handleBackButton() {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      renderSteps();
    } else if (selectedBundleId) {
      // If we're at the first step and a bundle is selected, go back to bundle selection
      selectedBundleId = null;
      renderBundlesList();
    }
  }

  // Add back button event listener
  document.addEventListener('DOMContentLoaded', function () {
    const backButton = document.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', handleBackButton);
    }
  });

  // Add this function to handle the API call
  async function sendBundleDataToAPI(addedItems, bundleId) {
    try {
      // Calculate total price
      const totalPrice = addedItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * item.quantity);
      }, 0);

      // Prepare the data with Shopify GID format
      const bundleData = {
        mix_match_bundle_id: bundleId,
        variants: addedItems.map(item => `gid://shopify/ProductVariant/${item.variantId}`),
        total: totalPrice
      };

      // Call the API
      const response = await fetch(CART_SUCCESS_ENDPOINT, {
        method: 'POST',
        headers: { "Accept": "application/json" },
        body: JSON.stringify(bundleData)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Bundle data sent successfully:', result);

      // Add bundle attribute to cart after API success
      const cartResponse = await fetch(`${SHOPIFY_DOMAIN}/cart/update.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributes: {
            'Bundleapp': result.data
          }
        })
      });

      if (!cartResponse.ok) {
        throw new Error('Failed to update cart attributes');
      }

      const cartResult = await cartResponse.json();
      console.log('Cart updated successfully:', cartResult);

      return result;
    } catch (error) {
      console.error('Failed to send bundle data:', error);
      throw error;
    }
  }

});
