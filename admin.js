

const CLIENT_ID = encodeURIComponent('313413442353-oo9lelugjuvf8jiu8oiqa9t13cl0ieau.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URI = encodeURIComponent('https://kafbbclobjeghdlngimbkajpnhihemok.chromiumapp.org');
const STATE = encodeURIComponent('9870061921a6bd6d88c9ce4f1acb2baeaaeaafba920f86ea2492cc019dc7f987');
const SCOPE = encodeURIComponent('openid');
const PROMPT = encodeURIComponent('consent');





// localStorage.setItem('isLoggedIn', 'true

chrome.storage.sync.set({ isLoggedIn: 'false' }, function() {
    console.log('User signed out');
});

let idCounter = 2;

function addField() {
    let newDiv = document.createElement('div');
    newDiv.style.display = 'flex';
    newDiv.style.flexDirection = 'row';
    newDiv.style.justifyContent = 'space-between';
    newDiv.style.alignItems = 'center';

    let newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'allergen';
    newInput.placeholder = 'Allergen';
    newDiv.appendChild(newInput);

    let newButton = document.createElement('button');
    newButton.id = 'removeButton' + idCounter;
    newButton.style.width = '25px';
    newButton.style.height = '25px';
    newButton.textContent = '-';
    newButton.addEventListener('click', function() {
        let parentDiv = this.parentElement;
        let grandparentDiv = parentDiv.parentElement;
        if (grandparentDiv.children.length > 1) {
            parentDiv.remove();
        } else {
            parentDiv.querySelector('input').value = '';
        }
    });
    newDiv.appendChild(newButton);

    document.getElementById('border').appendChild(newDiv);

    idCounter++;
}




function create_auth_url() {
    let nounce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)); 
    let url =
    `
    https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=${SCOPE}&prompt=${PROMPT}&nonce=${nounce}
    `;

    console.log(url);
    return url;
}


function is_user_signed_in() {
    return user_signed_in;
}


function get_user_id () {
    if (is_user_signed_in()) {
        return user_id;
    }
    else {
        console.log('User not signed in');
        return null;
    }
}


const mentainSession = () => {
    if (chrome.storage.sync.get(['isLoggedIn']) === 'true') {
        document.getElementById('adminHome').style.display = 'block';
        document.getElementById('loginDiv').style.display = 'none';
    }
    else {
        document.getElementById('adminHome').style.display = 'none';
        document.getElementById('loginDiv').style.display = 'block';
    }
}



const add_event_listeners = () => {
    document.querySelector('#adminLogin').addEventListener('click', () => {
        chrome.identity.launchWebAuthFlow({
            url: create_auth_url(),
            interactive: true
        }, (redirect_url)=>{
            console.log(redirect_url);
            let id_token = redirect_url.split('id_token=')[1].split('&')[0];
            console.log(id_token);

            // get user info

            console.log("getting user information")
            const user_info = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(id_token.split('.')[1]));
            console.log(user_info);


            if ( (user_info.iss === "https://accounts.google.com" || user_info.iss === "accounts.google.com") &&  
                user_info.aud === CLIENT_ID) {
                    // send post request to 142.93.213.90:8000/ with user id to get user role
                    let xhr = new XMLHttpRequest();
                    xhr.open('POST', 'http://142.93.213.90:8000/', true);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.send(JSON.stringify({ user_id: user_info.sub }));


                    console.log("valid token, sending request for user role")
                    // wait for response
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            console.log(xhr.responseText);
                            let response = JSON.parse(xhr.responseText);
                            if (response.role === 'admin') {
                                // open a new tab with the admin.html page
                                // alert('Admin login successful');
                                // change div styles to display admin page
                                document.getElementById('adminHome').style.display = 'block';
                                document.getElementById('loginDiv').style.display = 'none';
                                // localStorage.setItem('isLoggedIn', 'true');
                                chrome.storage.sync.set({ isLoggedIn: 'true' }, function() {
                                    console.log('User signed in');
                                });
                            }
                            else {
                                alert('You are not an admin');
                            }
                        }
                    }
            }
            else {
                console.log('Invalid token');
                sendResponse({ message: 'fail' });
            }
        })

    });

    document.querySelector('#addAllergenButton').addEventListener('click', () => {
        // show div addAllergenDiv and hide div adminHome
        document.getElementById('addAllergenDiv').style.display = 'block';
        document.getElementById('adminHome').style.display = 'none';

    });

    document.querySelector("#cancleAllergensAdd").addEventListener('click', () => {
        document.getElementById('addAllergenDiv').style.display = 'none';
        document.getElementById('adminHome').style.display = 'block';
    });

    document.querySelector("#deleteAllergenButton").addEventListener('click', () => {
        // show div deleteAllergenDiv and hide div adminHome
        document.getElementById('removeAllergensDiv').style.display = 'block';
        document.getElementById('adminHome').style.display = 'none';
    });

    document.querySelector("#cancleAllergensRemove").addEventListener('click', () => {
        document.getElementById('removeAllergensDiv').style.display = 'none';
        document.getElementById('adminHome').style.display = 'block';
    });

    document.querySelector("#saveAllergensAdd").addEventListener('click', () => {
        // get the allergens from the input fields
        let allergens = [];
        document.querySelectorAll('input[name="allergen"]').forEach((input) => {
            allergens.push(input.value);
        });

        // send post request to 142.93.213.90:8000/ with allergens to add
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://142.93.213.90:8000/add-allergens', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ allergens: allergens }));

        // wait for response
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log(xhr.responseText);
                let response = JSON.parse(xhr.responseText);
                if (response.message === 'success') {

                    // clear the input fields
                    document.querySelectorAll('input[name="allergen"]').forEach((input) => {
                        input.value = '';
                    });

                    // remvoe all the input fields except the first one
                    let border = document.getElementById('border');
                    while (border.children.length > 1) {
                        border.removeChild(border.lastChild);
                    }

                    alert('Allergens added successfully');
                    document.getElementById('addAllergenDiv').style.display = 'none';
                    document.getElementById('adminHome').style.display = 'block';
                }
                else {
                    console.log("failed to add allergen");
                }
            }
        }

    });

    document.querySelector("#searchButton").addEventListener('click', () => {
        //  send request to 142.93.213.90:8000/search-allergens to get allergen with the search term
        
        // get the search term
        let searchTerm = document.querySelector('#search').value;
        
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://142.93.213.90:8000/search-allergens', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ allergen: searchTerm }));

        // on reposnse, display the allergens in the div
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log(xhr.responseText);
                let response = JSON.parse(xhr.responseText);

                console.log(response);
                if (response.message === 'success') {
                    // add the allergens to the allergenList div in the following format:
                    // <ul id="list">
                    //     <li><input type="checkbox" id="checkbox1" name="checkbox1" value="value1">value1</li>
                    //     <li><input type="checkbox" id="checkbox2" name="checkbox2" value="value2">value2</li>
                    //     <li><input type="checkbox" id="checkbox3" name="checkbox3" value="value3">value3</li>
                    //     <li><input type="checkbox" id="checkbox4" name="checkbox4" value="value4">value4</li>
                    //     <li><input type="checkbox" id="checkbox5" name="checkbox5" value="value5">value5</li>
                    // </ul>
                    let allergenList = document.getElementById('allergenList');
                    allergenList.innerHTML = '';
                    let ul = document.createElement('ul');
                    ul.id = 'list';
                    allergenList.appendChild(ul);
                    // add allergens to the list
                    // repose.allergens is in the format { allergen1_id: allergen1, allergen2_id: allergen2, ... }
                    // where allergen1, allergen2, ... are the names of the allergens
                    // and allergen1_id, allergen2_id, ... are the ids of the allergens

                    for (let allergen in response.allergens) {
                        let li = document.createElement('li');
                        let checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = allergen;
                        checkbox.checked = false;
                        li.appendChild(checkbox);
                        li.appendChild(document.createTextNode(response.allergens[allergen]));
                        ul.appendChild(li);
                    }
                }
                else {
                    alert('Failed to add allergens');
                }
            }
        }

    });


    // Clear the input field of the existing remove button's parent when clicked, if it's the only field; otherwise, remove it
    document.querySelector("#removeButton1").addEventListener('click', function() {
        let parentDiv = this.parentElement;
        let grandparentDiv = parentDiv.parentElement;
        if (grandparentDiv.children.length > 1) {
            parentDiv.remove();
        } else {
            parentDiv.querySelector('input').value = '';
        }
    });

    // document.querySelector("logoutButton").addEventListener('click', () => {
    //     // chrome.storage.sync.set({ user_signed_in: false }, function() {
    //     //     console.log('User signed out');
    //     // });
    //     document.getElementById('adminHome').style.display = 'none';
    //     document.getElementById('loginDiv').style.display = 'block';
    // });


    document.querySelector("#saveAllergensRemove").addEventListener('click', () => {
        // get the allergens to remove
        let allergens = [];
        document.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
            allergens.push(checkbox.id);
        });

        // send post request to 142.93.213.90:8000/ with allergens to remove
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://142.93.213.90:8000/remove-allergens', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ allergens: allergens }));

        // wait for response
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log(xhr.responseText);
                let response = JSON.parse(xhr.responseText);
                if (response.message === 'success') {
                    // clear the input fields
                    document.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
                        checkbox.checked = false;
                    });

                    // clear the search field
                    document.querySelector('#search').value = '';

                    // clear the list of allergens
                    document.getElementById('list').innerHTML = '';
                    
                    alert('Allergens removed successfully');
                    document.getElementById('removeAllergensDiv').style.display = 'none';
                    document.getElementById('adminHome').style.display = 'block';
                }
                else {
                    console.log("failed to remove allergen");
                }
            }
        }

    });



    document.querySelector('#addButton').addEventListener('click', () => {
        // add new input field to the existing div wit id 'border'
        addField();
    });

    document.querySelector('#logoutButton').addEventListener('click', () => {
        // localStorage.setItem('isLoggedIn', 'false');
        chrome.storage.sync.set({ isLoggedIn: 'false' }, function() {
            console.log('User signed out');
        });
        
        document.getElementById('adminHome').style.display = 'none';
        document.getElementById('loginDiv').style.display = 'block';
    });

}


// wiat for the DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    add_event_listeners();
    mentainSession();
});




//  on page reload, check if user is signed in
let user_signed_in = false;
let user_id = null;

