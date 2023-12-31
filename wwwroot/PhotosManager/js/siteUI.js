//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let sortType = "date";
let keywords = "";
let loginMessage = "";
let Email = "";
let EmailError = "";
let passwordError = "";
let currentETag = "";
let currentViewName = "photosList";
let delayTimeOut = 200; // seconds
const hoursOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };

// pour la pagination
let photoContainerWidth = 400;
let photoContainerHeight = 400;
let limit;
let HorizontalPhotosCount;
let VerticalPhotosCount;
let offset = 0;

Init_UI();
function Init_UI() {
    getViewPortPhotosRanges();
    initTimeout(delayTimeOut, renderExpiredSession);
    installWindowResizeHandler();
    if (API.retrieveLoggedUser())
        renderPhotos();
    else
        renderLoginForm();
}

// pour la pagination
function getViewPortPhotosRanges() {
    // estimate the value of limit according to height of content
    VerticalPhotosCount = Math.round($("#content").innerHeight() / photoContainerHeight);
    HorizontalPhotosCount = Math.round($("#content").innerWidth() / photoContainerWidth);
    limit = (VerticalPhotosCount + 1) * HorizontalPhotosCount;
    console.log("VerticalPhotosCount:", VerticalPhotosCount, "HorizontalPhotosCount:", HorizontalPhotosCount)
    offset = 0;
}
// pour la pagination
function installWindowResizeHandler() {
    var resizeTimer = null;
    var resizeEndTriggerDelai = 250;
    $(window).on('resize', function (e) {
        if (!resizeTimer) {
            $(window).trigger('resizestart');
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            $(window).trigger('resizeend');
        }, resizeEndTriggerDelai);
    }).on('resizestart', function () {
        console.log('resize start');
    }).on('resizeend', function () {
        console.log('resize end');
        if ($('#photosLayout') != null) {
            getViewPortPhotosRanges();
            if (currentViewName == "photosList")
                renderPhotosList();
        }
    });
}
function attachCmd() {
    $('#loginCmd').on('click', renderLoginForm);
    $('#logoutCmd').on('click', logout);
    $('#listPhotosCmd').on('click', renderPhotos);
    $('#listPhotosMenuCmd').on('click', renderPhotos);
    $('#listPhotosDate').on('click', renderPhotosDate);
    $('#listPhotosCreateur').on('click', renderPhotosCreateur);
    $('#listPhotosLike').on('click', renderPhotosByLikes);
    $('#listPhotosUser').on('click', renderPhotosUser);


    $('#editProfilMenuCmd').on('click', renderEditProfilForm);
    $('#renderManageUsersMenuCmd').on('click', renderManageUsers);
    $('#editProfilCmd').on('click', renderEditProfilForm);
    $('#aboutCmd').on("click", renderAbout);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Header management
function loggedUserMenu() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let manageUserMenu = `
            <span class="dropdown-item" id="renderManageUsersMenuCmd">
                <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers
            </span>
            <div class="dropdown-divider"></div>
        `;
        return `
            ${loggedUser.isAdmin ? manageUserMenu : ""}
            <span class="dropdown-item" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </span>
            <span class="dropdown-item" id="editProfilMenuCmd">
                <i class="menuIcon fa fa-user-edit mx-2"></i> Modifier votre profil
            </span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="listPhotosMenuCmd">
                <i class="menuIcon fa fa-image mx-2"></i> Liste des photos
            </span>


            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="listPhotosDate">
                <i class="menuIcon far fa-calendar"></i> Photos par date de création
            </span>

            <span class="dropdown-item" id="listPhotosCreateur">
                <i class="menuIcon fa-solid fa-users"></i> Photos par créateurs
            </span>

            <span class="dropdown-item" id="listPhotosLike">
                <i class="menuIcon fa-solid fa-thumbs-up"></i> Photos les plus aimées
            </span>

            <span class="dropdown-item" id="listPhotosUser">
                <i class="menuIcon fa-solid fa-user"></i> Mes photos
            </span>
        `;
    }
    else
        return `
            <span class="dropdown-item" id="loginCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </span>`;
}
function viewMenu(viewName) {
    if (viewName == "photosList") {
        // todo
        return "";
    }
    else
        return "";
}
function connectedUserAvatar() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser)
        return `
            <div class="UserAvatarSmall" userId="${loggedUser.Id}" id="editProfilCmd" style="background-image:url('${loggedUser.Avatar}')" title="${loggedUser.Name}"></div>
        `;
    return "";
}
function refreshHeader() {
    UpdateHeader(currentViewTitle, currentViewName);
}
function UpdateHeader(viewTitle, viewName) {
    currentViewTitle = viewTitle;
    currentViewName = viewName;
    $("#header").empty();
    $("#header").append(`
        <span title="Liste des photos" id="listPhotosCmd"><img src="images/PhotoCloudLogo.png" class="appLogo"></span>
        <span class="viewTitle">${viewTitle} 
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
        </span>

        <div class="headerMenusContainer">
            <span>&nbsp</span> <!--filler-->
            <i title="Modifier votre profil"> ${connectedUserAvatar()} </i>         
            <div class="dropdown ms-auto dropdownLayout">
                <div data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                </div>
                <div class="dropdown-menu noselect">
                    ${loggedUserMenu()}
                    ${viewMenu(viewName)}
                    <div class="dropdown-divider"></div>
                    <span class="dropdown-item" id="aboutCmd">
                        <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
                    </span>
                </div>
            </div>

        </div>
    `);
    if (viewName == "photosList") {

        $("#customHeader").show();
        $("#customHeader").empty();
        $("#customHeader").append(`
            <div class="searchContainer">
                <input type="search" class="form-control" placeholder="Recherche par mots-clés" id="keywords" value="${keywords}"/>
                <i class="cmdIcon fa fa-search" id="setSearchKeywordsCmd"></i>
            </div>
        `);
        $("#setSearchKeywordsCmd").on("click", function (event) {
            renderPhotosKeywords($("#keywords").val());

        });
    } else {
        $("#customHeader").hide();
    }
    attachCmd();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Actions and command
async function login(credential) {
    console.log("login");
    loginMessage = "";
    EmailError = "";
    passwordError = "";
    Email = credential.Email;
    await API.login(credential.Email, credential.Password);
    if (API.error) {
        switch (API.currentStatus) {
            case 482: passwordError = "Mot de passe incorrect"; renderLoginForm(); break;
            case 481: EmailError = "Courriel introuvable"; renderLoginForm(); break;
            default: renderError("Le serveur ne répond pas"); break;
        }
    } else {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser.VerifyCode == 'verified') {
            if (!loggedUser.isBlocked)
                renderPhotos();
            else {
                loginMessage = "Votre compte a été bloqué par l'administrateur";
                logout();
            }
        }
        else
            renderVerify();
    }
}
async function logout() {
    console.log('logout');
    await API.logout();
    renderLoginForm();
}
function isVerified() {
    let loggedUser = API.retrieveLoggedUser();
    return loggedUser.VerifyCode == "verified";
}
async function verify(verifyCode) {
    let loggedUser = API.retrieveLoggedUser();
    if (await API.verifyEmail(loggedUser.Id, verifyCode)) {
        renderPhotos();
    } else {
        renderError("Désolé, votre code de vérification n'est pas valide...");
    }
}
async function editProfil(profil) {
    if (await API.modifyUserProfil(profil)) {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser) {
            if (isVerified()) {
                renderPhotos();
            } else
                renderVerify();
        } else
            renderLoginForm();

    } else {
        renderError("Un problème est survenu.");
    }
}
async function createProfil(profil) {
    if (await API.register(profil)) {
        loginMessage = "Votre compte a été créé. Veuillez prendre vos courriels pour réccupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion."
        renderLoginForm();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function adminDeleteAccount(userId) {
    if (await API.unsubscribeAccount(userId)) {
        renderManageUsers();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function deleteProfil() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        if (await API.unsubscribeAccount(loggedUser.Id)) {
            loginMessage = "Votre compte a été effacé.";
            logout();
        } else
            renderError("Un problème est survenu.");
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
async function renderError(message) {
    noTimeout();
    switch (API.currentStatus) {
        case 401:
        case 403:
        case 405:
            message = "Accès refusé...Expiration de votre session. Veuillez vous reconnecter.";
            await API.logout();
            renderLoginForm();
            break;
        case 404: message = "Ressource introuvable..."; break;
        case 409: message = "Ressource conflictuelle..."; break;
        default: if (!message) message = "Un problème est survenu...";
    }
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("Problème", "error");
    $("#newPhotoCmd").hide();
    $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="form">
                <button id="connectCmd" class="form-control btn-primary">Connexion</button>
            </div>
        `)
    );
    $('#connectCmd').on('click', renderLoginForm);
    /* pour debug
     $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="systemErrorContainer">
                <b>Message du serveur</b> : <br>
                ${API.currentHttpError} <br>

                <b>Status Http</b> :
                ${API.currentStatus}
            </div>
        `)
    ); */
}
function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("À propos...", "about");
    $("#newPhotoCmd").hide();
    $("#createContact").hide();
    $("#abort").show();
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de photos</h2>
                <hr>
                <p>
                    Petite application de gestion de photos multiusagers à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: vos noms d'équipiers
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderPhotos() {
    timeout();
    showWaitingGif();
    UpdateHeader('Liste des photos', 'photosList')
    $("#newPhotoCmd").show();
    $("#abort").hide();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser)
        renderPhotosList();
    else {
        renderLoginForm();
    }


}

async function renderPhotosUser() {
    UpdateHeader('Mes photos', 'photosListUser');
    eraseContent();
    $("#newPhotoCmd").show();

    const result = await API.GetPhotos();
    $("#content").append(`
    <div class="photosLayout" id="photosContainer">
        

    </div> `);

    const sortByDate = (a, b) => {
        return b.Date - a.Date;
    };


    result.data.sort(sortByDate);


    let thumbsUp = ``;

    let ownerHtml = "";


    for (const photo of result.data) {

        listLikes = await API.GetLikeByPhotoId(photo.Id);
        let title = await showLikesName(photo.Id);

        thumbsUp = `<i class='menuIcon far fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${photo.Id}' title="${title}"></i>`;

        //Change Like Icone
        for (const like of listLikes) {
            if (like.UserId == API.retrieveLoggedUser().Id) {
                thumbsUp = `<i class='menuIcon fas fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${result.Id}' likeId='${like.Id}' title="${title}"></i>`;
            }
        }

        let imageShared = "";


        if (photo.Shared) {
            imageShared = '<img src="http://localhost:5000/PhotosManager/images/shared.png" alt="" class="UserAvatarSmall sharedImage">';
        }

        //Si c ta photo
        if (photo.OwnerId == API.retrieveLoggedUser().Id) {
            ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
            <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


            $("#photosContainer").append(`
        
        <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
            <div class="photoTitleContainer" >
                <span class="photoTitle">${photo.Title}
                
                </span>
               ${ownerHtml}
            </div>
            <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                ${imageShared}

            </div>
            <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                <span class="likesSummary">${listLikes.length}
                ${thumbsUp}
                </span>
            </span>

        </div>`);
        }

    }




    $(".detailsCmd").on("click", function () {
        console.log("detail clicked");
        let photoId = $(this).attr("photoId");
        renderPhotoDetails(photoId);

    });
    $(".editCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        let ownerId = $(this).attr("ownerId");
        renderEditPhotos(photoId, ownerId);

    });
    $(".deleteCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        renderConfirmDeletePhoto(photoId);

    });
    $(".far.fa-thumbs-up").on("click", function () {
        let photoId = $(this).attr("photoId");
        let userLikeId = $(this).attr("userLikeId");

        let likeData = {
            PhotoId: photoId,
            UserId: userLikeId
        };

        // Call CreateLike with the provided data
        API.CreateLike(likeData)
        //location.reload();
        renderPhotosUser();
    });
    $(".fas.fa-thumbs-up").on("click", function () {
        let likeId = $(this).attr("likeId");

        API.DeleteLike(likeId);
        //location.reload();
        renderPhotosUser();
    });

    $("#newPhotoCmd").on("click", async function () {
        renderAddPhotos();
    });


}



async function renderPhotosDate() {
    UpdateHeader('Photos par date', 'photosListDate');
    eraseContent();
    $("#newPhotoCmd").show();

    const result = await API.GetPhotos();
    $("#content").append(`
    <div class="photosLayout" id="photosContainer">
        

    </div> `);


    const sortByDate = (a, b) => {
        return b.Date - a.Date;
    };


    result.data.sort(sortByDate);
    let thumbsUp = ``;

    let ownerHtml = "";


    for (const photo of result.data) {

        listLikes = await API.GetLikeByPhotoId(photo.Id);
        let title = await showLikesName(photo.Id);

        thumbsUp = `<i class='menuIcon far fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${photo.Id}' title="${title}"></i>`;

        for (const like of listLikes) {
            if (like.UserId == API.retrieveLoggedUser().Id) {
                thumbsUp = `<i class='menuIcon fas fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${result.Id}' likeId='${like.Id}' title="${title}"></i>`;
            }
        }

        let imageShared = "";


        if (photo.Shared) {
            imageShared = '<img src="http://localhost:5000/PhotosManager/images/shared.png" alt="" class="UserAvatarSmall sharedImage">';
        }

        //Si c ta photo
        if (photo.OwnerId == API.retrieveLoggedUser().Id) {
            ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
            <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


            $("#photosContainer").append(`
        
        <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
            <div class="photoTitleContainer" >
                <span class="photoTitle">${photo.Title}
                
                </span>
               ${ownerHtml}
            </div>
            <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                ${imageShared}

            </div>
            <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                <span class="likesSummary">${listLikes.length}
                ${thumbsUp}
                </span>
            </span>

        </div>`);
        }
        //Si tu est admin
        else if (API.retrieveLoggedUser().Authorizations.readAccess == 2) {
            ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
                <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


            $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>
                   ${ownerHtml}
                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
        }
        //Si la photo est partage
        else if (photo.Shared) {

            $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>

                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);

        }
        
    }




    $(".detailsCmd").on("click", function () {
        console.log("detail clicked");
        let photoId = $(this).attr("photoId");
        renderPhotoDetails(photoId);

    });
    $(".editCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        let ownerId = $(this).attr("ownerId");
        renderEditPhotos(photoId, ownerId);

    });
    $(".deleteCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        renderConfirmDeletePhoto(photoId);

    });
    $(".far.fa-thumbs-up").on("click", function () {
        let photoId = $(this).attr("photoId");
        let userLikeId = $(this).attr("userLikeId");

        let likeData = {
            PhotoId: photoId,
            UserId: userLikeId
        };

        // Call CreateLike with the provided data
        API.CreateLike(likeData)
        //location.reload();
        renderPhotosDate();
    });
    $(".fas.fa-thumbs-up").on("click", function () {
        let likeId = $(this).attr("likeId");

        API.DeleteLike(likeId);
        //location.reload();
        renderPhotosDate();
    });

    $("#newPhotoCmd").on("click", async function () {
        renderAddPhotos();
    });

}




async function renderPhotosCreateur() {
    UpdateHeader('Photos par créateurs', 'photosListCreateur');
    eraseContent();
    $("#newPhotoCmd").show();

    const result = await API.GetPhotos();
    $("#content").append(`
    <div class="photosLayout" id="photosContainer">
        

    </div> `);



    const sortByOwnerId = (a, b) => {
        return a.OwnerId.localeCompare(b.OwnerId);
    };


    result.data.sort(sortByOwnerId);

    let thumbsUp = ``;

    let ownerHtml = "";


    for (const photo of result.data) {

        listLikes = await API.GetLikeByPhotoId(photo.Id);
        let title = await showLikesName(photo.Id);

        thumbsUp = `<i class='menuIcon far fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${photo.Id}' title="${title}"></i>`;

        //Change Like Icone
        for (const like of listLikes) {
            if (like.UserId == API.retrieveLoggedUser().Id) {
                thumbsUp = `<i class='menuIcon fas fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${result.Id}' likeId='${like.Id}'  title="${title}"></i>`;
            }
        }

        let imageShared = "";


        if (photo.Shared) {
            imageShared = '<img src="http://localhost:5000/PhotosManager/images/shared.png" alt="" class="UserAvatarSmall sharedImage">';
        }

        //Si c ta photo
        if (photo.OwnerId == API.retrieveLoggedUser().Id) {
            ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
            <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


            $("#photosContainer").append(`
        
        <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
            <div class="photoTitleContainer" >
                <span class="photoTitle">${photo.Title}
                
                </span>
               ${ownerHtml}
            </div>
            <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                ${imageShared}

            </div>
            <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                <span class="likesSummary">${listLikes.length}
                ${thumbsUp}
                </span>
            </span>

        </div>`);
        }
        else if (API.retrieveLoggedUser().Authorizations.readAccess == 2) {
            ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
                <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


            $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>
                   ${ownerHtml}
                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
        }
        //Si la photo est partage
        else if (photo.Shared) {

            $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>

                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
            //Si tu est admin
        }
       
    }




    $(".detailsCmd").on("click", function () {
        console.log("detail clicked");
        let photoId = $(this).attr("photoId");
        renderPhotoDetails(photoId);

    });
    $(".editCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        let ownerId = $(this).attr("ownerId");
        renderEditPhotos(photoId, ownerId);

    });
    $(".deleteCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        renderConfirmDeletePhoto(photoId);

    });
    $(".far.fa-thumbs-up").on("click", function () {
        let photoId = $(this).attr("photoId");
        let userLikeId = $(this).attr("userLikeId");

        let likeData = {
            PhotoId: photoId,
            UserId: userLikeId
        };

        // Call CreateLike with the provided data
        API.CreateLike(likeData)
        //location.reload();
        renderPhotosCreateur();
    });
    $(".fas.fa-thumbs-up").on("click", function () {
        let likeId = $(this).attr("likeId");

        API.DeleteLike(likeId);
        //location.reload();
        renderPhotosCreateur();
    });

    $("#newPhotoCmd").on("click", async function () {
        renderAddPhotos();
    });
}




async function renderPhotosKeywords(keyword) {
    UpdateHeader('Photos par créateurs', 'photosList');
    eraseContent();
    $("#newPhotoCmd").show();

    const result = await API.GetPhotos();
    $("#content").append(`
    <div class="photosLayout" id="photosContainer">
        

    </div> `);



    let thumbsUp = ``;

    let ownerHtml = "";


    for (const photo of result.data) {

        if (photo.Title.toUpperCase().includes(keyword.toUpperCase())) {

            listLikes = await API.GetLikeByPhotoId(photo.Id);
            let title = await showLikesName(photo.Id);

            thumbsUp = `<i class='menuIcon far fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${photo.Id}' title="${title}"></i>`;

            //Change Like Icone
            for (const like of listLikes) {
                if (like.UserId == API.retrieveLoggedUser().Id) {
                    thumbsUp = `<i class='menuIcon fas fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${result.Id}' likeId='${like.Id}' title="${title}"></i>`;
                }
            }

            let imageShared = "";


            if (photo.Shared) {
                imageShared = '<img src="http://localhost:5000/PhotosManager/images/shared.png" alt="" class="UserAvatarSmall sharedImage">';
            }

            //Si c ta photo
            if (photo.OwnerId == API.retrieveLoggedUser().Id) {
                ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
            <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


                $("#photosContainer").append(`
        
        <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
            <div class="photoTitleContainer" >
                <span class="photoTitle">${photo.Title}
                
                </span>
               ${ownerHtml}
            </div>
            <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                ${imageShared}

            </div>
            <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                <span class="likesSummary">${listLikes.length}
                ${thumbsUp}
                </span>
            </span>

        </div>`);
            }
            else if (API.retrieveLoggedUser().Authorizations.readAccess == 2) {
                ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
                <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


                $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>
                   ${ownerHtml}
                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
            }
            //Si la photo est partage
            else if (photo.Shared) {

                $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>

                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
            }
            
        }
    }




    $(".detailsCmd").on("click", function () {
        console.log("detail clicked");
        let photoId = $(this).attr("photoId");
        renderPhotoDetails(photoId);

    });
    $(".editCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        let ownerId = $(this).attr("ownerId");
        renderEditPhotos(photoId, ownerId);

    });
    $(".deleteCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        renderConfirmDeletePhoto(photoId);

    });
    $(".far.fa-thumbs-up").on("click", function () {
        let photoId = $(this).attr("photoId");
        let userLikeId = $(this).attr("userLikeId");

        let likeData = {
            PhotoId: photoId,
            UserId: userLikeId
        };

        // Call CreateLike with the provided data
        API.CreateLike(likeData)
        //location.reload();
        renderPhotosKeywords(keyword);
    });
    $(".fas.fa-thumbs-up").on("click", function () {
        let likeId = $(this).attr("likeId");

        API.DeleteLike(likeId);
        //location.reload();
        renderPhotosKeywords(keyword);
    });

    $("#newPhotoCmd").on("click", async function () {
        renderAddPhotos();
    });

}



async function renderAddPhotos() {
    eraseContent();
    $("#newPhotoCmd").hide();
    UpdateHeader("Ajout de Photos", "addPhoto");
    $("#content").append(` <br/>
    <form class="form" id="addPhotoForm"'>
        <fieldset>
            <legend>Informations</legend>
            <input  type="text" 
                    class="form-control" 
                    name="Title" 
                    id="titre"
                    placeholder="Titre" 
                    required 
                    RequireMessage = 'Veuillez entrer un titre'
                    InvalidMessage = 'Titre invalide'/>


                    <textarea id="description" name="Description" rows="4" cols="50"
                    placeholder="Description" required 
                    RequireMessage = 'Veuillez entrer une description'
                    InvalidMessage = 'Description invalide' ></textarea>

                    <input type="checkbox" id="partage" name="Shared" />
                    <label for="partage">Partagé</label>
            
        </fieldset>
        
        <fieldset>
            <legend>Image</legend>
            <div class='imageUploader' 
                    newImage='true' 
                    controlId='Image' 
                    imageSrc='images/no-avatar.png' 
                    waitingImage="images/Loading_icon.gif">
        </div>
        </fieldset>

        <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
    </form>
    <div class="cancel">
        <button class="form-control btn-secondary" id="abortCreateProfilCmd">Annuler</button>
    </div>`);

    initFormValidation(); // important do to after all html injection!
    initImageUploaders();

    $('#addPhotoForm').on("submit", function (event) {
        let photoForm = getFormData($('#addPhotoForm'));

        event.preventDefault();
        let loggedUser = API.retrieveLoggedUser();
        photoForm.OwnerId = loggedUser.Id;
        photoForm.Date = new Date().getTime();
        //photoForm.Image = photoForm.Avatar;

        if (photoForm.Shared == "on") {
            photoForm.Shared = true;
        }
        else {
            photoForm.Shared = false;
        }
        API.CreatePhoto(photoForm);
        renderPhotosList();
    });

    $('#abortCreateProfilCmd').on('click', renderLoginForm);

}



function renderEditPhotos(id, ownerId) {
    eraseContent();
    $("#newPhotoCmd").hide();
    let photo = API.GetPhotosById(id);

    photo.then(function (result) {

        $("#content").append(` <br/>
        <form class="form" id="editPhotoForm"'>
            <fieldset>
                <legend>Informations</legend>
                <input  type="text" 
                        class="form-control" 
                        name="Title" 
                        id="titre"
                        placeholder="Titre" 
                        value="${result.Title}"
                        required 
                        RequireMessage = 'Veuillez entrer un titre'
                        InvalidMessage = 'Titre invalide'/>
    
    
                        <textarea id="description" name="Description" rows="4" cols="50"
                        placeholder="Description" required 

                        RequireMessage = 'Veuillez entrer une description'
                        InvalidMessage = 'Description invalide' >${result.Description}</textarea>
    
                        <input type="checkbox" id="partage" name="Shared" ${result.Shared ? 'checked' : ''} />
                        <label for="partage">Partagé</label>
                
            </fieldset>
            
            <fieldset>
                <legend>Image</legend>
                <div class='imageUploader' 
                        newImage='true' 
                        controlId='Image' 
                        imageSrc='${result.Image}' 
                        waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
    
            <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCreateProfilCmd">Annuler</button>
        </div>`);

        initFormValidation(); // important do to after all html injection!
        initImageUploaders();

        $('#editPhotoForm').on("submit", function (event) {
            let photoForm = getFormData($('#editPhotoForm'));


            event.preventDefault();
            photoForm.Id = id;
            photoForm.OwnerId = ownerId;
            photoForm.Date = new Date().getTime();

            photoForm.Shared = $('#partage').prop('checked');


            API.UpdatePhoto(photoForm);
            renderPhotosList();
        });

        $('#abortCreateProfilCmd').on('click', renderPhotosList);

    });

    UpdateHeader("Modification de Photos", "modifyPhoto");
}




async function renderPhotosList() {
    UpdateHeader('Liste des photos', 'photosList')
    eraseContent();
    $("#newPhotoCmd").show();

    const result = await API.GetPhotos();
    $("#content").append(`
    <div class="photosLayout" id="photosContainer">
        

    </div> `);
    let thumbsUp = ``;

    let ownerHtml = "";


    for (const photo of result.data) {

        listLikes = await API.GetLikeByPhotoId(photo.Id);
        let title = await showLikesName(photo.Id);
        thumbsUp = `<i class='menuIcon far fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${photo.Id}' title='${title}'></i>`;

        //Change Like Icone
        for (const like of listLikes) {
            if (like.UserId == API.retrieveLoggedUser().Id) {
                thumbsUp = `<i class='menuIcon fas fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${result.Id}' likeId='${like.Id}'  title='${title}'></i>`;
            }
        }
        let imageShared = "";


        if (photo.Shared) {
            imageShared = '<img src="http://localhost:5000/PhotosManager/images/shared.png" alt="" class="UserAvatarSmall sharedImage">';
        }

        //Si c ta photo
        if (photo.OwnerId == API.retrieveLoggedUser().Id) {
            ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
            <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


            $("#photosContainer").append(`
        
        <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
            <div class="photoTitleContainer" >
                <span class="photoTitle">${photo.Title}
                
                </span>
               ${ownerHtml}
            </div>
            <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                ${imageShared}

            </div>
            <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                <span class="likesSummary">${listLikes.length}
                ${thumbsUp}
                </span>
            </span>

        </div>`);
        }
        //SI tu est admin
        else if (API.retrieveLoggedUser().Authorizations.readAccess == 2) {
            ownerHtml = `<span class="editCmd" photoId="${photo.Id}" ownerId="${photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
                <span class="deleteCmd" photoId="${photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


            $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>
                   ${ownerHtml}
                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
        }
        //Si la photo est partage
        else if (photo.Shared) {

            $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${photo.Title}
                    
                    </span>

                </div>
                <div class="detailsCmd" photoId="${photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
           
        }
        
    }




    $(".detailsCmd").on("click", function () {
        console.log("detail clicked");
        let photoId = $(this).attr("photoId");
        renderPhotoDetails(photoId);

    });
    $(".editCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        let ownerId = $(this).attr("ownerId");
        renderEditPhotos(photoId, ownerId);

    });
    $(".deleteCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        renderConfirmDeletePhoto(photoId);

    });
    $(".far.fa-thumbs-up").on("click", function () {
        let photoId = $(this).attr("photoId");
        let userLikeId = $(this).attr("userLikeId");

        let likeData = {
            PhotoId: photoId,
            UserId: userLikeId
        };

        // Call CreateLike with the provided data
        API.CreateLike(likeData)
        //location.reload();
        renderPhotosList();
    });
    $(".fas.fa-thumbs-up").on("click", function () {
        let likeId = $(this).attr("likeId");

        API.DeleteLike(likeId);
        renderPhotosList();
        //location.reload();
    });

    $("#newPhotoCmd").on("click", async function () {
        renderAddPhotos();
    });


}


async function renderConfirmDeletePhoto(photoId) {
    timeout();
    let photo = API.GetPhotosById(photoId);

    photo.then(function (result) {
        eraseContent();
        UpdateHeader("Retrait de Photos", "confirmDeletePhoto");
        $("#newPhotoCmd").hide();
        $("#content").append(`
                    <div class="content loginForm">
                        <br>
                        <div class="form UserRow ">
                            <h2> Voulez-vous vraiment effacer cet Photo? </h2>
                            <div class="UserContainer noselect">
                                <div class="UserLayout">
                                <h4>${result.Title}</h4>
                                <br>
                                <br>
                                    <div class="photoImage" style="background-image:url('${result.Image}')"></div>
                                </div>
                            </div>
                        </div>           
                        <div class="form">
                            <button class="form-control btn-danger" id="deleteAccountCmd">Effacer</button>
                            <br>
                            <button class="form-control btn-secondary" id="abortDeleteAccountCmd">Annuler</button>
                        </div>
                    </div>
                `);
        $("#content").on("click", "#deleteAccountCmd", function () {
            // Handle delete action
            API.DeletePhoto(photoId);
            renderPhotosList();
            location.reload();
        });

        // Use event delegation to handle clicks on dynamic elements
        $("#content").on("click", "#abortDeleteAccountCmd", function () {
            renderPhotosList();

        });
    });


}





//Likes a faire
async function renderPhotoDetails(photoId) {
    UpdateHeader("Details", "details");
    eraseContent();
    let result = await API.GetPhotosById(photoId);

    let thumbsUp = ``;

    let ownerHtml = "";




        listLikes = await API.GetLikeByPhotoId(result.Id);
        let title = await showLikesName(result.Id);

        console.log(listLikes);


        thumbsUp = `<i class='menuIcon far fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${result.Id}' title="${title}"></i>`;

        for (const like of listLikes) {
            if (like.UserId == API.retrieveLoggedUser().Id) {
                thumbsUp = `<i class='menuIcon fas fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${result.Id}' likeId='${like.Id}' title="${title}"></i>`;
            }
        }
        //Change Like Icone



        let imageShared = "";


        if (result.Shared) {
            imageShared = '<img src="http://localhost:5000/PhotosManager/images/shared.png" alt="" class="UserAvatarSmall sharedImage">';
        }

        eraseContent();
        $("#newPhotoCmd").hide();
        //a faire
        let listeNomLikes = "Nic";


        $("#content").append(`
    <div>
        <span class="photoDetailsTitle">${result.Title}</span>
        <div class="">
            <img src="${result.Image}" alt="" class="photoDetailsLargeImage">
        </div>
        <span class="photoDetailsCreationDate">${new Date(result.Date).toLocaleDateString('fr-FR', hoursOptions)}
                <span class="likesSummary" title="${listeNomLikes}">${listLikes.length}
                    ${thumbsUp}
                </span>
            </span>
            <div class="photoDetailsDescription">
                ${result.Description}
            </div>
            <div class="form">
            <button class="form-control btn-secondary" id="abortDeleteAccountCmd">Annuler</button>

        </div>
    </div>
    
    `);




    
      
        $("#content").on("click", "#abortDeleteAccountCmd", function () {
            location.reload();
        });
        $(".far.fa-thumbs-up").on("click", function () {
            let photoId = $(this).attr("photoId");
            let userLikeId = $(this).attr("userLikeId");
    
            let likeData = {
                PhotoId: photoId,
                UserId: userLikeId
            };
    
            // Call CreateLike with the provided data
            API.CreateLike(likeData)
            renderPhotoDetails(photoId);
        });
        $(".fas.fa-thumbs-up").on("click", function () {
            let likeId = $(this).attr("likeId");
    
            API.DeleteLike(likeId);
            renderPhotoDetails(photoId);
        });


}

function renderVerify() {
    eraseContent();
    UpdateHeader("Vérification", "verify");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content">
            <form class="form" id="verifyForm">
                <b>Veuillez entrer le code de vérification de que vous avez reçu par courriel</b>
                <input  type='text' 
                        name='Code'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer le code que vous avez reçu par courriel'
                        InvalidMessage = 'Courriel invalide';
                        placeholder="Code de vérification de courriel" > 
                <input type='submit' name='submit' value="Vérifier" class="form-control btn-primary">
            </form>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#verifyForm').on("submit", function (event) {
        let verifyForm = getFormData($('#verifyForm'));
        event.preventDefault();
        showWaitingGif();
        verify(verifyForm.Code);
    });
}
function renderCreateProfil() {
    noTimeout();
    eraseContent();
    UpdateHeader("Inscription", "createProfil");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <br/>
        <form class="form" id="createProfilForm"'>
            <fieldset>
                <legend>Adresse ce courriel</legend>
                <input  type="email" 
                        class="form-control Email" 
                        name="Email" 
                        id="Email"
                        placeholder="Courriel" 
                        required 
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        CustomErrorMessage ="Ce courriel est déjà utilisé"/>

                <input  class="form-control MatchedInput" 
                        type="text" 
                        matchedInputId="Email"
                        name="matchedEmail" 
                        id="matchedEmail" 
                        placeholder="Vérification" 
                        required
                        RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                        InvalidMessage="Les courriels ne correspondent pas" />
            </fieldset>
            <fieldset>
                <legend>Mot de passe</legend>
                <input  type="password" 
                        class="form-control" 
                        name="Password" 
                        id="Password"
                        placeholder="Mot de passe" 
                        required 
                        RequireMessage = 'Veuillez entrer un mot de passe'
                        InvalidMessage = 'Mot de passe trop court'/>

                <input  class="form-control MatchedInput" 
                        type="password" 
                        matchedInputId="Password"
                        name="matchedPassword" 
                        id="matchedPassword" 
                        placeholder="Vérification" required
                        InvalidMessage="Ne correspond pas au mot de passe" />
            </fieldset>
            <fieldset>
                <legend>Nom</legend>
                <input  type="text" 
                        class="form-control Alpha" 
                        name="Name" 
                        id="Name"
                        placeholder="Nom" 
                        required 
                        RequireMessage = 'Veuillez entrer votre nom'
                        InvalidMessage = 'Nom invalide'/>
            </fieldset>
            <fieldset>
                <legend>Avatar</legend>
                <div class='imageUploader' 
                        newImage='true' 
                        controlId='Avatar' 
                        imageSrc='images/no-avatar.png' 
                        waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
   
            <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCreateProfilCmd">Annuler</button>
        </div>
    `);
    $('#loginCmd').on('click', renderLoginForm);
    initFormValidation(); // important do to after all html injection!
    initImageUploaders();
    $('#abortCreateProfilCmd').on('click', renderLoginForm);
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    $('#createProfilForm').on("submit", function (event) {
        let profil = getFormData($('#createProfilForm'));
        delete profil.matchedPassword;
        delete profil.matchedEmail;
        event.preventDefault();
        showWaitingGif();
        createProfil(profil);
    });
}
async function renderManageUsers() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser.isAdmin) {
        if (isVerified()) {
            showWaitingGif();
            UpdateHeader('Gestion des usagers', 'manageUsers')
            $("#newPhotoCmd").hide();
            $("#abort").hide();
            let users = await API.GetAccounts();
            if (API.error) {
                renderError();
            } else {
                $("#content").empty();
                users.data.forEach(user => {
                    if (user.Id != loggedUser.Id) {
                        let typeIcon = user.Authorizations.readAccess == 2 ? "fas fa-user-cog" : "fas fa-user-alt";
                        typeTitle = user.Authorizations.readAccess == 2 ? "Retirer le droit administrateur à" : "Octroyer le droit administrateur à";
                        let blockedClass = user.Authorizations.readAccess == -1 ? "class=' blockUserCmd cmdIconVisible fa fa-ban redCmd'" : "class='blockUserCmd cmdIconVisible fa-regular fa-circle greenCmd'";
                        let blockedTitle = user.Authorizations.readAccess == -1 ? "Débloquer $name" : "Bloquer $name";
                        let userRow = `
                        <div class="UserRow"">
                            <div class="UserContainer noselect">
                                <div class="UserLayout">
                                    <div class="UserAvatar" style="background-image:url('${user.Avatar}')"></div>
                                    <div class="UserInfo">
                                        <span class="UserName">${user.Name}</span>
                                        <a href="mailto:${user.Email}" class="UserEmail" target="_blank" >${user.Email}</a>
                                    </div>
                                </div>
                                <div class="UserCommandPanel">
                                    <span class="promoteUserCmd cmdIconVisible ${typeIcon} dodgerblueCmd" title="${typeTitle} ${user.Name}" userId="${user.Id}"></span>
                                    <span ${blockedClass} title="${blockedTitle}" userId="${user.Id}" ></span>
                                    <span class="removeUserCmd cmdIconVisible fas fa-user-slash goldenrodCmd" title="Effacer ${user.Name}" userId="${user.Id}"></span>
                                </div>
                            </div>
                        </div>           
                        `;
                        $("#content").append(userRow);
                    }
                });
                $(".promoteUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.PromoteUser(userId);
                    renderManageUsers();
                });
                $(".blockUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.BlockUser(userId);
                    renderManageUsers();
                });
                $(".removeUserCmd").on("click", function () {
                    let userId = $(this).attr("userId");
                    renderConfirmDeleteAccount(userId);
                });
            }
        } else
            renderVerify();
    } else
        renderLoginForm();
}
async function renderConfirmDeleteAccount(userId) {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let userToDelete = (await API.GetAccount(userId)).data;
        if (!API.error) {
            eraseContent();
            UpdateHeader("Retrait de compte", "confirmDeleteAccoun");
            $("#newPhotoCmd").hide();
            $("#content").append(`
                <div class="content loginForm">
                    <br>
                    <div class="form UserRow ">
                        <h4> Voulez-vous vraiment effacer cet usager et toutes ses photos? </h4>
                        <div class="UserContainer noselect">
                            <div class="UserLayout">
                                <div class="UserAvatar" style="background-image:url('${userToDelete.Avatar}')"></div>
                                <div class="UserInfo">
                                    <span class="UserName">${userToDelete.Name}</span>
                                    <a href="mailto:${userToDelete.Email}" class="UserEmail" target="_blank" >${userToDelete.Email}</a>
                                </div>
                            </div>
                        </div>
                    </div>           
                    <div class="form">
                        <button class="form-control btn-danger" id="deleteAccountCmd">Effacer</button>
                        <br>
                        <button class="form-control btn-secondary" id="abortDeleteAccountCmd">Annuler</button>
                    </div>
                </div>
            `);
            $("#deleteAccountCmd").on("click", function () {
                adminDeleteAccount(userToDelete.Id);
            });
            $("#abortDeleteAccountCmd").on("click", renderManageUsers);
        } else {
            renderError("Une erreur est survenue");
        }
    }
}
function renderEditProfilForm() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Profil", "editProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <br/>
            <form class="form" id="editProfilForm"'>
                <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}"/>
                <fieldset>
                    <legend>Adresse ce courriel</legend>
                    <input  type="email" 
                            class="form-control Email" 
                            name="Email" 
                            id="Email"
                            placeholder="Courriel" 
                            required 
                            RequireMessage = 'Veuillez entrer votre courriel'
                            InvalidMessage = 'Courriel invalide'
                            CustomErrorMessage ="Ce courriel est déjà utilisé"
                            value="${loggedUser.Email}" >

                    <input  class="form-control MatchedInput" 
                            type="text" 
                            matchedInputId="Email"
                            name="matchedEmail" 
                            id="matchedEmail" 
                            placeholder="Vérification" 
                            required
                            RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                            InvalidMessage="Les courriels ne correspondent pas" 
                            value="${loggedUser.Email}" >
                </fieldset>
                <fieldset>
                    <legend>Mot de passe</legend>
                    <input  type="password" 
                            class="form-control" 
                            name="Password" 
                            id="Password"
                            placeholder="Mot de passe" 
                            InvalidMessage = 'Mot de passe trop court' >

                    <input  class="form-control MatchedInput" 
                            type="password" 
                            matchedInputId="Password"
                            name="matchedPassword" 
                            id="matchedPassword" 
                            placeholder="Vérification" 
                            InvalidMessage="Ne correspond pas au mot de passe" >
                </fieldset>
                <fieldset>
                    <legend>Nom</legend>
                    <input  type="text" 
                            class="form-control Alpha" 
                            name="Name" 
                            id="Name"
                            placeholder="Nom" 
                            required 
                            RequireMessage = 'Veuillez entrer votre nom'
                            InvalidMessage = 'Nom invalide'
                            value="${loggedUser.Name}" >
                </fieldset>
                <fieldset>
                    <legend>Avatar</legend>
                    <div class='imageUploader' 
                            newImage='false' 
                            controlId='Avatar' 
                            imageSrc='${loggedUser.Avatar}' 
                            waitingImage="images/Loading_icon.gif">
                </div>
                </fieldset>

                <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
                
            </form>
            <div class="cancel">
                <button class="form-control btn-secondary" id="abortEditProfilCmd">Annuler</button>
            </div>

            <div class="cancel">
                <hr>
                <button class="form-control btn-warning" id="confirmDelelteProfilCMD">Effacer le compte</button>
            </div>
        `);
        initFormValidation(); // important do to after all html injection!
        initImageUploaders();
        addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
        $('#abortEditProfilCmd').on('click', renderPhotos);
        $('#confirmDelelteProfilCMD').on('click', renderConfirmDeleteProfil);
        $('#editProfilForm').on("submit", function (event) {
            let profil = getFormData($('#editProfilForm'));
            delete profil.matchedPassword;
            delete profil.matchedEmail;
            event.preventDefault();
            showWaitingGif();
            editProfil(profil);
        });
    }
}
function renderConfirmDeleteProfil() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Retrait de compte", "confirmDeleteProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <div class="content loginForm">
                <br>
                
                <div class="form">
                 <h3> Voulez-vous vraiment effacer votre compte? </h3>
                    <button class="form-control btn-danger" id="deleteProfilCmd">Effacer mon compte</button>
                    <br>
                    <button class="form-control btn-secondary" id="cancelDeleteProfilCmd">Annuler</button>
                </div>
            </div>
        `);
        $("#deleteProfilCmd").on("click", deleteProfil);
        $('#cancelDeleteProfilCmd').on('click', renderEditProfilForm);
    }
}
function renderExpiredSession() {
    noTimeout();
    loginMessage = "Votre session est expirée. Veuillez vous reconnecter.";
    logout();
    renderLoginForm();
}
function renderLoginForm() {
    noTimeout();
    eraseContent();
    UpdateHeader("Connexion", "Login");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content" style="text-align:center">
            <div class="loginMessage">${loginMessage}</div>
            <form class="form" id="loginForm">
                <input  type='email' 
                        name='Email'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        placeholder="adresse de courriel"
                        value='${Email}'> 
                <span style='color:red'>${EmailError}</span>
                <input  type='password' 
                        name='Password' 
                        placeholder='Mot de passe'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre mot de passe'
                        InvalidMessage = 'Mot de passe trop court' >
                <span style='color:red'>${passwordError}</span>
                <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
            </form>
            <div class="form">
                <hr>
                <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
            </div>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#createProfilCmd').on('click', renderCreateProfil);
    $('#loginForm').on("submit", function (event) {
        let credential = getFormData($('#loginForm'));
        event.preventDefault();
        showWaitingGif();
        login(credential);
    });
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    console.log($form.serializeArray());
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

async function renderPhotosByLikes() {
    UpdateHeader('Photos par nombre de likes', 'photosList');
    eraseContent();
    $("#newPhotoCmd").show();

    let result = await API.GetPhotos();

    const likesPromises = result.data.map(async (photo) => {
        const likes = await API.GetLikeByPhotoId(photo.Id);
        return { photo, likes };
    });

    let likesData = await Promise.all(likesPromises);

    likesData.sort((a, b) => b.likes.length - a.likes.length);

    result = likesData;

   // result.data.sort(async function (a, b) {
    //    a = await API.GetLikeByPhotoId(a.Id);
    //    b = await API.GetLikeByPhotoId(b.Id);
        
   //     return a.length - b.length;
   //   });
      
    $("#content").append(`
    <div class="photosLayout" id="photosContainer">
        

    </div> `);

    console.log(result);

    let thumbsUp = ``;

    let ownerHtml = "";
    
      console.log(result.data);

    for (const data of result) {


            listLikes = await API.GetLikeByPhotoId(data.photo.Id);
            
            let title = await showLikesName(data.photo.Id);
            thumbsUp = `<i class='menuIcon far fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${data.photo.Id}' title="${title}"></i>`;

            //Change Like Icone
            for (const like of listLikes) {
                if (like.UserId == API.retrieveLoggedUser().Id) {
                    thumbsUp = `<i class='menuIcon fas fa-thumbs-up' userLikeId='${API.retrieveLoggedUser().Id}' photoId='${data.photo.Id}' likeId='${like.Id} 'title="${title}"></i>`;
                }
            }

            let imageShared = "";


            if (data.photo.Shared) {
                imageShared = '<img src="http://localhost:5000/PhotosManager/images/shared.png" alt="" class="UserAvatarSmall sharedImage">';
            }

            //Si c ta photo
            if (data.photo.OwnerId == API.retrieveLoggedUser().Id) {
                ownerHtml = `<span class="editCmd" photoId="${data.photo.Id}" ownerId="${data.photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
            <span class="deleteCmd" photoId="${data.photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


                $("#photosContainer").append(`
        
        <div class="photoLayout photoLayoutNoScrollSnap" photoId="${data.photo.Id}">
            <div class="photoTitleContainer" >
                <span class="photoTitle">${data.photo.Title}
                
                </span>
               ${ownerHtml}
            </div>
            <div class="detailsCmd" photoId="${data.photo.Id}" style="display: block; max-width: 100%; position:relative">
                <img src="${data.photo.Image}" alt="" class="photoImage" style="position: relative;">
                <img src="${data.photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                ${imageShared}

            </div>
            <span class="photoCreationDate">${new Date(data.photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                <span class="likesSummary">${listLikes.length}
                ${thumbsUp}
                </span>
            </span>

        </div>`);
            }
            else if (API.retrieveLoggedUser().Authorizations.readAccess == 2) {
                ownerHtml = `<span class="editCmd" photoId="${data.photo.Id}" ownerId="${data.photo.OwnerId}"> <i class="fa-solid fa-pencil dodgerblueCmd" ></i></span>
                <span class="deleteCmd" photoId="${data.photo.Id}"><i class="fa-solid fa-trash dodgerblueCmd" ></i></span>`;


                $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${data.photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${data.photo.Title}
                    
                    </span>
                   ${ownerHtml}
                </div>
                <div class="detailsCmd" photoId="${data.photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${data.photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${data.photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(data.photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);
            }
            //Si la photo est partage
            else if (data.photo.Shared) {

                $("#photosContainer").append(`
            
            <div class="photoLayout photoLayoutNoScrollSnap" photoId="${data.photo.Id}">
                <div class="photoTitleContainer" >
                    <span class="photoTitle">${data.photo.Title}
                    
                    </span>

                </div>
                <div class="detailsCmd" photoId="${data.photo.Id}" style="display: block; max-width: 100%; position:relative">
                    <img src="${data.photo.Image}" alt="" class="photoImage" style="position: relative;">
                    <img src="${data.photo.Owner.Avatar}" alt="" class="UserAvatarSmall cornerAvatar">
                    ${imageShared}
    
                </div>
                <span class="photoCreationDate">${new Date(data.photo.Date).toLocaleDateString('fr-FR', hoursOptions)}
                    <span class="likesSummary">${listLikes.length}
                    ${thumbsUp}
                    </span>
                </span>
    
            </div>`);

            }
            
        
    }




    $(".detailsCmd").on("click", function () {
        console.log("detail clicked");
        let photoId = $(this).attr("photoId");
        renderPhotoDetails(photoId);

    });
    $(".editCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        let ownerId = $(this).attr("ownerId");
        renderEditPhotos(photoId, ownerId);

    });
    $(".deleteCmd").on("click", function () {
        let photoId = $(this).attr("photoId");
        renderConfirmDeletePhoto(photoId);

    });
    $(".far.fa-thumbs-up").on("click", function () {
        let photoId = $(this).attr("photoId");
        let userLikeId = $(this).attr("userLikeId");

        let likeData = {
            PhotoId: photoId,
            UserId: userLikeId
        };

        // Call CreateLike with the provided data
        API.CreateLike(likeData)
        //location.reload();
        renderPhotosByLikes();
    });
    $(".fas.fa-thumbs-up").on("click", function () {
        let likeId = $(this).attr("likeId");

        API.DeleteLike(likeId);
        //location.reload();
        renderPhotosByLikes();
    });

    $("#newPhotoCmd").on("click", async function () {
        renderAddPhotos();
    });

}
async function showLikesName(id){
    const likes = await API.GetLikeByPhotoId(id);
    let stringNames = "";
    if(likes.length != 0){
        let i =0;
        for (const like of likes) {
            if(i<=10){
                const user = await API.GetAccount(like.UserId);
                stringNames = stringNames + "\n" + user.data.Name;
                i++;
            }
        }
    }else{
        return "Aucun Like";
    }
    return stringNames;

}