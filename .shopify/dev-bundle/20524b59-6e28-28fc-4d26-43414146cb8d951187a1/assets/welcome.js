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

  const FRONT_API_ENDPOINT = "https://loose-towers-offers-newsletters.trycloudflare.com/";
  // const FRONT_API_ENDPOINT = "https://myanmar-rest-turning-responded.trycloudflare.com/";

  const MIXMATCH_ENDPOINT = `${FRONT_API_ENDPOINT}front/api/mixmatch`;
  const CART_SUCCESS_ENDPOINT = `${FRONT_API_ENDPOINT}front/api/autodiscount`;


  let currentStepIndex = 0;
  const selectedProductsByStep = {};
  const target = document.getElementById("welcome-block");
  let stepsData = [];
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
    selectedBundleId = null;

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
                images: item?.images?.[0]?.originalSrc || DEFAULT_IMAGE,
                price: item.price || "$0.00",
                description: section.description || ""
              }));
            }

            return {
              step: section.sectionName || `Step ${index + 1}`,
              Image: "https://cdn.shopify.com/s/files/1/0070/7032/files/shoes.jpg",
              quantity: parseInt(section.quantity || "0", 10),
              minqty: parseInt(section.minquantity || "0", 10),
              minrange: parseInt(section.minquantity || "0", 10),
              maxrange: parseInt(section.maxquantity || "99", 10),
              type: stepType,
              products
            };
          }));

          renderSteps();
        }
      });
    });
  };

  const isStepValid = (stepIndex) => {
    const selected = selectedProductsByStep[stepIndex] || [];
    const { minqty, minrange, maxrange, type, quantity } = stepsData[stepIndex];

    // Calculate total quantity for this step
    const totalQty = selected.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return type === "minQuantity" ? totalQty >= minqty :
      type === "rangeQuantity" ? totalQty >= minrange && totalQty <= maxrange :
        type === "exactQuantity" ? totalQty >= quantity : false;
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
    return stepsData.map((step, stepKey) => {
      const { minqty, minrange, maxrange, type, quantity } = step;
      const requiredQty = type === "minQuantity" ? minqty :
        type === "rangeQuantity" ? maxrange :
          type === "exactQuantity" ? quantity : 0;

      const selected = selectedProductsByStep[stepKey] || [];
      // Create circles for required quantity
      const circles = Array(requiredQty).fill().map((_, index) => {
        const product = selected[index];
        const isFilled = !!product;
        const currentIndex = circleindex++;
        return `
          <div class="bundle-perfume-box">
            <div class="bundle-perfume-box-img">
              ${isFilled ? `
                <img src="${product.images}" alt="" style="height:45px; width:45px;">
                <div class="bundle-quantity">${product.quantity || 1}</div>
                <div class="bundle-close" data-step="${stepKey}" data-variant="${product.variantsid}" data-index="${index}">
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
  };

  const getProductRequirementText = (step) => {
    const { type, minqty, minrange, maxrange, quantity } = step;

    switch (type) {
      case "minQuantity":
        return `Buy minimum ${minqty} products`;
      case "rangeQuantity":
        return `Select between ${minrange} to ${maxrange} products`;
      case "exactQuantity":
        return `Select exactly ${quantity} products`;
      default:
        return "Select products";
    }
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

  const calculateProgress = () => {
    let totalProducts = 0;
    let addedProducts = 0;

    // Calculate total required products and currently added products
    stepsData.forEach((step, stepIndex) => {
      const { minqty, minrange, maxrange, type, quantity } = step;
      const requiredQty = type === "minQuantity" ? minqty :
        type === "rangeQuantity" ? maxrange :
          type === "exactQuantity" ? quantity : 0;

      totalProducts += requiredQty;

      const selected = selectedProductsByStep[stepIndex] || [];
      addedProducts += selected.reduce((sum, product) => sum + (product.quantity || 1), 0);
    });

    // Calculate percentage (ensure it doesn't exceed 100%)
    return Math.min(Math.round((addedProducts / totalProducts) * 100), 100);
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

  const renderSteps = () => {
    if (!target || !stepsData[currentStepIndex]) return;

    const currentBundle = bundlesData.find(b => b.id === selectedBundleId);
    const bundleTitle = currentBundle?.title || "Custom Bundle";
    const totalPrice = calculateTotalPrice();

    const discountText = getDiscountText(currentBundle);
    const requirementText = getProductRequirementText(stepsData[currentStepIndex]);

    // Get current step's requirements
    const { minqty, minrange, maxrange, type, quantity } = stepsData[currentStepIndex];

    // Calculate total selected quantity for current step
    const selectedProducts = selectedProductsByStep[currentStepIndex] || [];
    const totalSelectedQty = selectedProducts.reduce((sum, product) => sum + (product.quantity || 1), 0);

    // Determine if we've reached the maximum allowed quantity
    const maxAllowedQty = type === "minQuantity" ? minqty :
      type === "rangeQuantity" ? maxrange :
        type === "exactQuantity" ? quantity : 0;

    const isMaxQtyReached = totalSelectedQty >= maxAllowedQty;

    // Check if all steps are valid (progress is 100%)
    const isAllStepsValid = areAllStepsValid();

    const productHtml = stepsData[currentStepIndex].products.map(product => {
      // Check if this product is already selected
      const isSelected = selectedProducts.some(p => p.variantsid === product.variantsid);

      const selectedProduct = selectedProducts.find(p => p.variantsid === product.variantsid);
      const productQty = selectedProduct ? selectedProduct.quantity : 0;

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
            <a href="#" class="add-to-box ${isMaxQtyReached && !isSelected ? 'disabled' : ''} add-to-box-btn ${isSelected ? 'selected' : ''}"
               data-step="${currentStepIndex}"
               data-variant="${product.variantsid}"

               style="pointer-events: ${isMaxQtyReached && !isSelected ? 'none' : 'auto'};
                      opacity: ${isMaxQtyReached && !isSelected ? '0.5' : '1'}">
              ${isSelected ? `Added (${productQty})` : 'Add to Box'}
            </a>
          </div>
        </li>
      `;
    }).join("");

    const progressWidth = calculateProgress();


    const stepHtml = stepsData.map((s, i) => `
      <li class="step-tab ${i <= currentStepIndex ? 'active' : ''}" data-index="${i}">
        <p class="step-tab">${s.step}</p>
        <div class="progress-bar progress-bar--success">
        <div class="progress-bar__bar"></div></div>
      </li>
    `).join("");


    target.innerHTML = `
      <section class="bundle-price">
        <div class="bundle-img-animation ${progressWidth === 100 ? 'active' : ''}"></div>

        <div class="bundle-sticky-mobile-tab">
          <div class="container">
            <div class="bundle-price-row">
                <div class="bundle-inner-row">
                  <div class="bundle-product-name">
                    <h5>${bundleTitle}</h5>
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

            <div class="bundle-tab-content">
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
                        <span>Total ₹ ${discountText}/-</span>
                         <span>Total ₹  ${isAllStepsValid ? 'MRP: ' + totalPrice }/-</span>
                        <a href="#"y
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

        const selected = selectedProductsByStep[stepKey];
        const product = selected[index];

        // Remove only the last added quantity
        if (product.quantity > 1) {
          product.quantity--;
        } else {
          // If this was the last quantity, remove the product entry
          selectedProductsByStep[stepKey] = selected.filter((_, i) => i !== index);
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

        const selected = selectedProductsByStep[stepIndex] || [];
        const existingProduct = selected.find(p => p.variantsid === variantId);

        // Get current step's requirements
        const { minqty, minrange, maxrange, type, quantity } = stepsData[stepIndex];
        const maxAllowedQty = type === "minQuantity" ? minqty :
          type === "rangeQuantity" ? maxrange :
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
              await sendBundleDataToAPI(addedItems, selectedBundleId);
              // loadingText.style.display = "none";
              // showSuccess("All items have been successfully added to your cart!");
              handleFloCheckoutBtn();
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
      images: node.images.edges[0]?.node?.url || DEFAULT_IMAGE,
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
                images: item?.images?.[0]?.originalSrc || DEFAULT_IMAGE,
                price: item.price || "$0.00",
                description: section.description || ""
              }));
            }

            return {
              step: section.sectionName || `Step ${index + 1}`,
              Image: "https://cdn.shopify.com/s/files/1/0070/7032/files/shoes.jpg",
              quantity: parseInt(section.quantity || "0", 10),
              minqty: parseInt(section.minquantity || "0", 10),
              minrange: parseInt(section.minquantity || "0", 10),
              maxrange: parseInt(section.maxquantity || "99", 10),
              type: stepType,
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