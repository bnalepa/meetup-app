// Pop-up handling logic
const popupOverlay = document.getElementById('popup-overlay');
const popupWindow = document.getElementById('popup-window');
const popupClose = document.getElementById('popup-close');
const popupOk = document.getElementById('popup-ok');
const popupCancel = document.getElementById('popup-cancel');

// Function to show pop-up
function showPopup(title = "Popup Title", content = "Popup content goes here...", okButton = "OK",  cancelButton = "Cancel",  onOk = null, onCancel = null) {
    document.querySelector('#popup-title').innerHTML = title;
    document.querySelector('#popup-content').innerHTML = content;
    popupOk.innerHTML = okButton;
    popupCancel.innerHTML =  cancelButton;


    popupOverlay.classList.remove('hidden');
    popupWindow.classList.remove('hidden')
    // OK button click
    popupOk.onclick = () => {
        popupOverlay.classList.add('hidden'); 
        popupWindow.classList.add('hidden');
        if (onOk) onOk(); 
    };

    // Cancel button click
    popupCancel.onclick = () => {
        popupOverlay.classList.add('hidden'); 
        popupWindow.classList.add('hidden');
        if (onCancel) onCancel();
    };

    // Close button (X) click
    popupClose.onclick = () => {
        popupOverlay.classList.add('hidden'); 
        popupWindow.classList.add('hidden');
        if (onCancel) onCancel();
    };
}


