import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoModel from '../models/photo.js';
import PhotoLikeModel from '../models/photoLike.js';
import Controller from './Controller.js';

export default
    class Photos extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoModel()), Authorizations.user());
        this.photoLikesRepository = new Repository(new PhotoLikeModel());
    }


    //Create Photos
    photos(photo) {
        console.log("Rentre dans controller");
        if (this.repository != null) {
            photo.Created = utilities.nowInSeconds();
            let newPhoto = this.repository.add(photo);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.created(newPhoto);
            } else {
                if (this.repository.model.state.inConflict)
                    this.HttpContext.response.conflict(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else
            this.HttpContext.response.notImplemented();
    }


    //GetPhotos
    GetPhotos(){
        console.log("GetPhotos");
        this.HttpContext.response.JSON(this.repository.getAll());
    }

    //Remove Photo
    remove(id) { // warning! this is not an API endpoint
       // if (Authorizations.writeGranted(this.HttpContext, Authorizations.user())) {
            //this.tokensRepository.keepByFilter(token => token.User.Id != id);
            //let previousAuthorization = this.authorizations;
            //this.authorizations = Authorizations.user();
            super.remove(id);
        //    this.authorizations = previousAuthorization;
        //}
    }

    //Modify photo
    modify(photo) {
        // empty asset members imply no change and there values will be taken from the stored record
        if (Authorizations.writeGranted(this.HttpContext, Authorizations.user())) {
            if (this.repository != null) {
                photo.Created = utilities.nowInSeconds();
                let foundedPhoto = this.repository.findByField("Id", photo.Id);
                if (foundedPhoto != null) {
                  
                    let updatedPhoto = this.repository.update(photo.Id, photo);
                    if (this.repository.model.state.isValid) {
                        this.HttpContext.response.updated(updatedPhoto);
                    }
                    else {
                        if (this.repository.model.state.inConflict)
                            this.HttpContext.response.conflict(this.repository.model.state.errors);
                        else
                            this.HttpContext.response.badRequest(this.repository.model.state.errors);
                    }
                } else
                    this.HttpContext.response.notFound();
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
}