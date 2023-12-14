import Model from './model.js';
import UserModel from './user.js';
import PhotoModel from './photo.js';
import Repository from './repository.js';

export default class PhotoLike extends Model {
    constructor()
    {
        super();
        this.addField('PhotoId', 'string');
        this.addField('UserId','string');

        //this.setKey("PhotoId"+"UserId");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let usersRepository = new Repository(new UserModel());
        let photoRepo = new Repository(new PhotoModel());
        instance.Owner = usersRepository.get(instance.OwnerId);
        instance.Photo = photoRepo.get(instance.PhotoId);

        //instance.OwnerName = instance.Owner.Name;
        return instance;
    }
}