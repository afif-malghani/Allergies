

var observer = new MutationObserver(function(mutations) {
    var addToCartButtons = document.querySelectorAll('[class*="add_to_cart"]:not(.eventListenerAdded)');
    // for each button if event listener is not added, add it

    addToCartButtons.forEach(function(button) {
        if (!button.classList.contains('eventListenerAdded')) {
            button.addEventListener('click', function() {
                var productLink = button.parentElement.parentElement.parentElement.parentElement.querySelector('a');
                
                console.log(productLink.href);

                // pass the product link to background.js and wait for response
                chrome.runtime.sendMessage({ message: 'productLink', productLink: productLink.href }, (response)=>{
                    if(response.status === "allergies"){
                        // display Modal with warning message
                        var modal = document.createElement('div');

                        // Set the innerHTML of the div
                        modal.innerHTML = `
                            <div style="position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);">
                                <div style="background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%;">
                                    <p>Product contains allergens.</p>
                                    <button id="closeModal">Close</button>
                                </div>
                            </div>
                        `;

                        // Append the div to the body
                        document.body.appendChild(modal);

                        // Add an event listener to the close button
                        document.getElementById('closeModal').addEventListener('click', function() {
                            modal.style.display = 'none';
                        });

                        
                    }
                })
            })

            // add class to button so that it is not added again
            button.classList.add('eventListenerAdded');
        }
    });
});


let timer = null;
var cartObserver = new MutationObserver(function(mutations) {
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(() => {
        let cartItems = []
        console.log('Page completely loaded');
        //  get href where data-test = '__cart_item_name_link__' and add warning message
        document.querySelectorAll('a[data-test="__cart_item_name_link__"]:not(.warningAdded)')
        .forEach(
            (link) => {
                // send message to background.js to get the product URLs
                cartItems.push(link.href);
            }
        );
        chrome.runtime.sendMessage({ message: 'productLink', productLink: cartItems }, (response)=>{
            
            console.log(response);
            
            if (response.status === 'allergies') {
                // response.allergies is a list of all products that contain allergens
                // loop through the list and add warning message to each product
                response.allergies.forEach(function(allergy) {
                    var warningDiv = document.createElement('div');
                    warningDiv.style.color = 'red';
                    warningDiv.style.fontWeight = 'bold';
                    warningDiv.style.fontSize = '20px';
                    warningDiv.innerHTML = 'Product contains allergens';

                    // remove https://www.carrefouruae.com/ from the link
                    allergy = allergy.replace('https://www.carrefouruae.com', '');
                    var addBefore =document.querySelector('a[href="' + allergy + '"]:not(.warningAdded)').parentElement.parentElement;
                    addBefore.parentElement.insertBefore(warningDiv, addBefore);
                    document.querySelector('a[href="' + allergy + '"]').classList.add('warningAdded');
                });
            }

            // if(response.status === 'allergies') {
            //     var warningDiv = document.createElement('div');
            //     warningDiv.style.color = 'red';
            //     warningDiv.style.fontWeight = 'bold';
            //     warningDiv.style.fontSize = '20px';
            //     warningDiv.innerHTML = 'Product contains allergens';
            //     var addBefore = link.parentElement.parentElement
            //     addBefore.parentElement.insertBefore(warningDiv, addBefore);
            //     link.classList.add('warningAdded');
            // }
        })

        cartObserver.disconnect();
    }
    , 500); // Wait for 1 second of no mutations
});




// // listen for messages from background.js
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if (request.message === 'settingsNeeded') {
//         //  add model to the DOM asking the user to go to the extension
//         var modal = document.createElement('div');

//         // Set the innerHTML of the div
//         modal.innerHTML = `
//             <div style="position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);">
//                 <div style="background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%;">
//                     <p>Please go to the extension settings to set your preferences.</p>
//                     <button id="closeModal">Close</button>
//                 </div>
//             </div>
//         `;

//         // Append the div to the body
//         document.body.appendChild(modal);

//         // Add an event listener to the close button
//         document.getElementById('closeModal').addEventListener('click', function() {
//             modal.style.display = 'none';
//         });
//     }
//     else if (request.message === 'allergiesFound') {


//         // if current page is cart page, add a warning message to the product link
//         if (window.location.href === 'https://www.carrefouruae.com/app/cart') {
//             console.log(request.productLink);
//         }
//         else {


//             //  add model to the DOM asking the user to go to the extension
//             var modal = document.createElement('div');

//             // Set the innerHTML of the div
//             modal.innerHTML = `
//                 <div style="position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);">
//                     <div style="background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%;">
//                         <p>Product contains allergens.</p>
//                         <button id="closeModal">Close</button>
//                     </div>
//                 </div>
//             `;

//             // Append the div to the body
//             document.body.appendChild(modal);

//             // Add an event listener to the close button
//             document.getElementById('closeModal').addEventListener('click', function() {
//                 modal.style.display = 'none';
//             });
//         }
//     }
// });

// // when navigated to cart page
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//     if (changeInfo.status === 'complete' && tab.url.includes('https://www.carrefouruae.com/app/cart')) {
//         console.log("Page fully loaded");
//     }
// });


// if the page is the cart page
window.onload = function() {
    if (window.location.href === 'https://www.carrefouruae.com/app/cart') {
        console.log('Cart page');
        cartObserver.observe(document, { childList: true, subtree: true });
    }
}

observer.observe(document, { childList: true, subtree: true });


// observer.observe(document, { childList: true, subtree: true });