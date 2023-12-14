import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoModel from '../models/photo.js';
import PhotoLikeModel from '../models/photoLike.js';
import Controller from './Controller.js';

export default
    class PhotolikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoLikeModel()), Authorizations.user());
        //this.photoLikesRepository = new Repository(new PhotoLikeModel());
    }


    //Create Photos
  //  Like(like) {
   //     console.log("Rentre dans controller like");
   //     if (this.repository != null) {

   //         let newLike = this.repository.add(like);
    //        if (this.repository.model.state.isValid) {
    //            this.HttpContext.response.created(newLike);
    //        } else {
    //            if (this.repository.model.state.inConflict)
   //                 this.HttpContext.response.conflict(this.repository.model.state.errors);
   //             else
   //                 this.HttpContext.response.badRequest(this.repository.model.state.errors);
   //         }
   //     } else
   //         this.HttpContext.response.notImplemented();
    //}


    //index(idPhoto){
    //    this.HttpContext.response.JSON(this.repository.get(idPhoto));
    //}

   
}