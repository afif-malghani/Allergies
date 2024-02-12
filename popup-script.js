// wait for the DOM to be loaded

const mentainSession = () => {
        let status = localStorage.getItem('isLoggedIn')
        let user_role = localStorage.getItem('user_role');

        console.log('Value currently is ' + status);
        if (status === 'true') {
            document.getElementById('newUserScreen').style.display = 'none';
            document.getElementById('welcomeDiv').style.display = 'none';
            document.getElementById('userDiv').style.display = 'block';
            
            if(user_role === 'admin'){
                console.log('admin');
                document.getElementById("authAdmin").style.display = "block";
            }
            document.getElementById('welcomeDiv').style.display = 'none';
        }
        else if
         (status === 'newUser') {
            document.getElementById('newUserScreen').style.display = 'block';
            document.getElementById('welcomeDiv').style.display = 'none';
        }
        else {
            document.getElementById('userDiv').style.display = 'none';
            document.getElementById('welcomeDiv').style.display = 'block';
        }
}



function add_evnet_listeneres() {

    document.querySelector('#loginBn').addEventListener('click', () => {
        let status = localStorage.getItem('isLoggedIn')
        if(status === 'true'){
            document.getElementById('newUserScreen').style.display = 'none';
            document.getElementById('welcomeDiv').style.display = 'none';
            document.getElementById('userDiv').style.display = 'block';
            return;
        }
        chrome.runtime.sendMessage({ message: 'login'}, (response)=>{
            if (response.message === 'success') {

                localStorage.setItem('isLoggedIn', true);
                localStorage.setItem('user_id', response.user_id);
                
                
                document.getElementById('newUserScreen').style.display = 'block';
                
                
                console.log(response.user_role)

                document.getElementById('welcomeDiv').style.display = 'none';
            }
        });
    });

    document.querySelector('#newUserBn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ message: 'newUser', user_name: document.getElementById('name').value, user_age: document.getElementById('age').value }, (response)=>{
          if (response.message === 'success') {
              document.getElementById('newUserScreen').style.display = 'none';
              document.getElementById('userDiv').style.display = 'block';
              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('user_id', response.user_id);
            //   window.close();
          }
        });
    } );


    document.querySelector('#logoutBn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ message: 'logout'}, (response)=>{
          if (response.message === 'success') {
              document.getElementById('userDiv').style.display = 'none';
              document.getElementById('welcomeDiv').style.display = 'block';
              localStorage.setItem('isLoggedIn', 'false');
              localStorage.removeItem('user_id');
              window.close();
          }
        });
    });


    document.querySelector('#settingsBn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ message: 'settings', user:localStorage.getItem('user_id')  }, (response)=>{
          if (response.message === 'success') {
              const allergens = response.allergens;

              if (Object.keys(allergens).length === 0) {
                  document.getElementById('allergensDiv').innerHTML = 'No allergens found';
                  document.getElementById('userDiv').style.display = 'none';
                  document.getElementById('settingsDiv').style.display = 'block';
                  return;
              }
              let allergensDiv = document.getElementById('allergensDiv');

              // clear the div
              allergensDiv.innerHTML = '';

              // create a list of allergens
              let allergensList = document.createElement('ul');

              // add the list to the div
              allergensDiv.appendChild(allergensList);

              // create a list of allergens with checkboxes at the beginning of each allergen

              for (let allergen in allergens) {
                  // create a list item
                  let allergenListItem = document.createElement('li');

                  // create a checkbox
                  let allergenCheckbox = document.createElement('input');
                  allergenCheckbox.type = 'checkbox';
                  allergenCheckbox.id = allergen;

                  // create a label for the checkbox
                  let allergenLabel = document.createElement('label');
                  allergenLabel.htmlFor = allergen;
                  allergenLabel.innerHTML = allergens[allergen];

                  // add the checkbox and label to the list item
                  allergenListItem.appendChild(allergenCheckbox);
                  allergenListItem.appendChild(allergenLabel);

                  // if the allergen name contains " (selected)", remove it from the text and check the checkbox
                  if (allergens[allergen].includes(' (selected)')) {
                      allergenLabel.innerHTML = allergens[allergen].replace(' (selected)', '');
                      allergenCheckbox.checked = true;
                  }

                  
                  // add the list item to the list
                  allergensList.appendChild(allergenListItem);


              }

              // remove bullet points from the list
              allergensList.style.listStyleType = 'none';

              document.getElementById('userDiv').style.display = 'none';
              document.getElementById('settingsDiv').style.display = 'block';
          }
        });
    });

    // on text change in searchBar, filter the list of allergens in the settings page
    document.querySelector('#searchBar').addEventListener('keyup', () => {
        // get the text in the search bar
        let searchText = document.getElementById('searchBar').value;

        // get the list of allergens
        let allergensList = document.getElementById('allergensDiv').children[0].children;

        // loop through the list of allergens
        for (let allergen of allergensList) {
            // get the allergen name
            let allergenName = allergen.children[1].innerHTML;

            // if the allergen name contains the search text, display the allergen
            if (allergenName.toLowerCase().includes(searchText.toLowerCase())) {
                allergen.style.display = 'block';
            }
            // else, hide the allergen
            else {
                allergen.style.display = 'none';
            }
        }
    });

    document.querySelector('#cancleButton').addEventListener('click', () => {
      document.getElementById('userDiv').style.display = 'block';
      document.getElementById('settingsDiv').style.display = 'none';
    });

    document.querySelector('#saveButton').addEventListener('click', () => {

      const checkedCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
      // get the ids of the checked checkboxes

      console.log(checkedCheckboxes);

      console.log("User logged in: " + localStorage.getItem('isLoggedIn'));
      console.log("User id: " + localStorage.getItem('user_id'));

      const checkedValues = checkedCheckboxes.map(checkbox => checkbox.id);

      console.log(checkedValues);
      
      let user_id = localStorage.getItem('user_id');
      chrome.runtime.sendMessage({ message: "savedSettings" , settings: checkedValues, user_id:user_id } , (response)=>{
          console.log(response);
          if (response.message === 'success') {
              console.log('Settings saved');
              // set the style of the divs
              document.getElementById('userDiv').style.display = 'block';
              document.getElementById('settingsDiv').style.display = 'none';
              
              window.close();
          }
      });
    });

    
    document.querySelector('#admin').addEventListener('click', () => {
      // open a new tab with the admin.html page
      chrome.tabs.create({url: chrome.extension.getURL('admin.html')});
    });


    // add a message listener to listen for messages from the background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === 'user_id') {
            console.log('user_id requested');
            let user_id = localStorage.getItem('user_id');
            console.log(user_id);
            if (user_id !== null) {
                sendResponse({ message: 'success', user_id: user_id });
            }
            else {
                sendResponse({ message: 'fail' });
            }
        }
    });

}

document.addEventListener('DOMContentLoaded', () => {
  add_evnet_listeneres();
  mentainSession();
});