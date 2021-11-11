import '../css/styles.scss'
import '../css/drag-n-drop.scss'

let username = ''
let password = ''
let basticAuth = ''

let filesDone = 0
let filesToDo = 0
let progressBar = document.getElementById('progress-bar')

const form = document.getElementById('form');
form.addEventListener('submit', logSubmit);

const onSaveButton = document.getElementById('onSave')
onSaveButton.addEventListener('click', (event) => {
    console.log('... uploadedFilesList', uploadedFilesList)

    for (let step = 0; step < uploadedFilesList.length; step++) {
        postImage(uploadedFilesList[step])
    }

    resetImagesInput()
})

const userNameInput = document.getElementById('userName')
const passwordInput = document.getElementById('password')
userNameInput.addEventListener('change', (event) => {
    username = event.target.value
});
passwordInput.addEventListener('change', (event) => {
    password = event.target.value
});

const loginPage = document.querySelector('.login-page')
const profilePage = document.querySelector('.profile-page')

const nameField = document.getElementsByClassName('profile-page__field name')
const sftp_urlField = document.getElementsByClassName('profile-page__field sftp_url')

// REQUEST >>

const url = 'https://ptest.quatrix.it/api/1.0/'

let headers = new Headers();
let headers2 = new Headers();
let headers3 = new Headers();
let session_id = ''
let outgoing_id = ''

// GET SESSION ID
const getSessionLogin = () => {
    headers = new Headers();

    basticAuth = `Basic ${btoa(username + ":" + password)}`
    headers.append('Authorization', basticAuth);

    fetch(url + 'session/login', {
        method:'GET',
        headers: headers,
    })
    .catch(error => {
        console.log('... found an error')
        console.log(error)
    })
    .then(response => response.json())
    .then(json => {
        console.log('... 1')
        console.log(json)

        if (json.session_id) {

            // LOCAL STORAGE
            localStorage.setItem('session_id', json.session_id)

            session_id = json.session_id

            getProfile()

            loginPage.style.display = 'none'
            profilePage.style.display = ''
        }
    })
}

// LOGOUT
const logOutButton = document.getElementById('logOut');
logOutButton.addEventListener('click', () => {
    fetch(url + 'session/logout', {
        method:'GET'
    })
    localStorage.removeItem('session_id')

    loginPage.style.display = ''
    profilePage.style.display = 'none'

    nameField[0].children[1].innerHTML = ''
    sftp_urlField[0].children[1].innerHTML = ''
    outgoing_id = ''

    headers = new Headers()
    headers2 = new Headers()
    headers3 = new Headers()
})

// GET PROFILE
const getProfile = () => {
    headers2.append('X-Auth-Token', session_id);
    headers3.append('X-Auth-Token', session_id);

    fetch(url + 'profile', {
        method:'GET',
        headers: headers2,
    })
    .catch(error => {
        console.log('... profile error')
        console.log(error)
    })
    .then(response => response.json())
    .then(json => {
        console.log('... 2')
        console.log(json)

        if (json.msg && json.msg === 'Action is not allowed') {
            loginPage.style.display = ''
            profilePage.style.display = 'none'
            return
        }

        // set profile params
        nameField[0].children[1].innerHTML = json.name
        sftp_urlField[0].children[1].innerHTML = json.sftp_url
        outgoing_id = json.outgoing_id
    })
}


if (localStorage.getItem('session_id') !== null) {
    session_id = localStorage.getItem('session_id')

    getProfile()

    loginPage.style.display = 'none'
    profilePage.style.display = ''
}

// POST IMAGE
const postImage = async (file) => {

    const myBody = {
        "name": file.name,
        "parent_id": outgoing_id,
        "resolve": true,
        "file_size": file.size
    }

    console.log('... myBody', myBody)

    headers3.append('Content-Type', 'application/json');
    headers3.append('accept', 'application/json');

    await fetch(url + 'upload/link', {
        method:'POST',
        headers: headers3,
        body: JSON.stringify(myBody)
    })
    .catch(error => console.log(error))
    .then(response => response.json())
    .then(json => {
        console.log('... postImage response')
        console.log(json)
    })
}

function logSubmit(event) {
    console.log(`Form Submitted! Time stamp: ${event.timeStamp}`);
    event.preventDefault();
    getSessionLogin()
}





// DRAG N DROP
let dropArea = document.getElementById('drop-area')
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
})
function preventDefaults (e) {
    e.preventDefault()
    e.stopPropagation()
}
;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
})
;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
})
function highlight(e) {
    dropArea.classList.add('highlight')
}
function unhighlight(e) {
    dropArea.classList.remove('highlight')
}



let uploadedFilesList = null

const handleFiles = (files) => {
    uploadedFilesList = [...files]
    initializeProgress(uploadedFilesList.length)
    uploadedFilesList.forEach(previewFile)

    onSaveButton.disabled = false
    resetImagesButton.disabled = false
}

dropArea.addEventListener('drop', handleDrop, false)
function handleDrop(e) {
    let dt = e.dataTransfer
    let files = dt.files
    handleFiles(files)
}

const imagesInput = document.getElementById('fileElem');
imagesInput.addEventListener('change', (event) => {
    console.log('... uploaded', event.target.files)
    handleFiles(event.target.files)
})

const resetImagesButton = document.getElementById('clearBtn')
resetImagesButton.addEventListener('click', resetImagesInput)
function resetImagesInput() {
    console.log('clicked')
    uploadedFilesList = null
    document.getElementById('gallery').innerHTML = ''
    progressBar.value = 0

    onSaveButton.disabled = true
    resetImagesButton.disabled = true
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function previewFile(file) {
    let reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = function() {

        let item = document.createElement('div')
        item.classList.add('item')

        let img = document.createElement('img')
        img.src = reader.result

        let imgDescContainer = document.createElement('div')
        imgDescContainer.classList.add('item__description')

        let imgName = document.createElement('div')
        imgName.innerHTML = file.name
        imgName.classList.add('item__name')

        let imgSize = document.createElement('div')
        imgSize.innerHTML = formatBytes(file.size)
        imgSize.classList.add('item__size')

        imgDescContainer.appendChild(imgName)
        imgDescContainer.appendChild(imgSize)

        item.appendChild(img)
        item.appendChild(imgDescContainer)

        document.getElementById('gallery').appendChild(item)
    }

    progressDone()
}

function initializeProgress(numfiles) {
    progressBar.value = 0
    filesDone = 0
    filesToDo = numfiles
}
function progressDone() {
    filesDone++
    progressBar.value = filesDone / filesToDo * 100
}
// 




