
let user_signed_in = false;
let user_id = null;
let user_allergens_in_cart = [];
const scopes = ['openid', 'email', 'profile'];
const CLIENT_ID = encodeURIComponent('313413442353-oo9lelugjuvf8jiu8oiqa9t13cl0ieau.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URI = encodeURIComponent('https://kafbbclobjeghdlngimbkajpnhihemok.chromiumapp.org');
const STATE = encodeURIComponent('9870061921a6bd6d88c9ce4f1acb2baeaaeaafba920f86ea2492cc019dc7f987');
const SCOPE = encodeURIComponent('openid');
const PROMPT = encodeURIComponent('consent');

function create_auth_url() {
    let nounce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)); 
    let url =
    `
    https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=${SCOPE}&prompt=${PROMPT}&nonce=${nounce}
    `;

    console.log(url);
    return url;
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(self.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}


function is_user_signed_in() {
    let user_signed_in = false;
    return user_signed_in;
}


function getUserFromServer(user_id) {
    fetch("http://142.93.213.90:8000/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user_id })
    }).then(response => response.json())
    .then(data => {
        if (data.message === "success" && data.user_role === 'None') {
            console.log('new user');
        }
        else if(data.message === "success"){
            console.log('user');
        }
        else {
            console.log('error');
            return null;
        }
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        console.log('returning response from getUserFromServer @ '+date+' '+time);

        return { message: 'success', user_id: user_info.sub, user_role: data.user_role };
    });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.message === 'login') {
        console.log('login');
        console.log(request.user_id);
        
        console.log("logged in user:",request.user_id);
        
        chrome.identity.launchWebAuthFlow({
            url: create_auth_url(),
            interactive: true
        }, (responseURL)=>{
            if (responseURL === undefined) {
                console.log('User cancelled login');
                // alert('User cancelled login');
                sendResponse({ message: 'fail' });
                return true;
            }
            else if (!responseURL){
                console.log('Error logging in');
                // alert('Error logging in');
                sendResponse({ message: 'fail' });
                return true;
            }
            
            let id_token = responseURL.split('id_token=')[1].split('&')[0];
            
            let user_info = parseJwt(id_token);

            if ( (user_info.iss === "https://accounts.google.com" || user_info.iss === "accounts.google.com") &&  
                user_info.aud === CLIENT_ID) {
                    sendResponse({ message: 'success', user_id: user_info.sub});                
                    return true;
                }
            else {
                console.log('Invalid token');
                sendResponse({ message: 'fail' });
                return true;
            }
        })
        return true;
    }

    else if (request.message === 'logout') {
        console.log('logout');
        sendResponse({ message: 'success' });
        return true;
    }
    
    // receive message from content.js
    else if (request.message === 'productLink') {
        let response = { message: 'fail' };

        console.log("product link received");
        
        let user_id = null;
        if (is_user_signed_in()) {
            console.log(request.productLink);

            // get user_id from popup-script.js by sending a message
            chrome.runtime.sendMessage({ message: 'user_id' }, (response)=>{
                console.log(response);
                if (response.message === 'success') {
                    user_id = response.user_id;
                }
            });

            fetch("http://142.93.213.90:8000/allergies", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id:user_id,  product_link: request.productLink })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.status === 'allergies') {
                    response = { message: 'success', status: 'allergies', allergies: data.allergies };
                    sendResponse(response);
                }
            })
            return true
        }
        else {
            console.log('User not signed in');
            sendResponse({ message: 'fail, user not signed in' });
        }
    }

    else if (request.message === 'savedSettings'){
        console.log("settings being saved");

        console.log(request.settings);

        console.log(request.user_id);

        let user_id = request.user_id;

        fetch("http://142.93.213.90:8000/settings", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id:user_id,  allergies: request.settings })
            }).then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.status === 'success'){
                    sendResponse({ message: 'success' });
                }
            })
        return true;
    }

    else if (request.message === 'settings') {


        var allergens = {};
        console.log("settings being requested");
        console.log(request);
        
        fetch("http://142.93.213.90:8000/allergens-all", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id:request.user })
        }).then(response => response.json())
        .then(data => {
            
            for (let allergen in data.allergens) {
                allergens[allergen] = data.allergens[allergen];
            }
            sendResponse({ message: 'success', allergens: allergens });

        }).catch(err => {
            sendResponse({ message: 'fail' });
        });
        return true;
    }


    else if (request.message === 'cartPage') {
        sendResponse({message: 'success', productURLs: user_allergens_in_cart});
    }

    else if (request.message === 'newUser'){

        console.log("new user being added");
        console.log(request);
        // fetch("http://142.93.213.90:8000/new-user", {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ user_id:get_user_id() })
        // }).then(response => response.json())

        sendResponse({ message: 'success', user_id: get_user_id() });
    }

    return true;
});