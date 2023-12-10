import Model from './model.js';
import UserModel from './user.js';
import PhotoModel from './photo.js';
import Repository from './repository.js';

export default class PhotoLike extends Model {
    constructor()
    {
        super();
        this.addField('OwnerId', 'string');
        this.addField('Liked','boolean');
        this.addField('Title', 'string');

        //this.setKey("Title");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let usersRepository = new Repository(new UserModel());
        instance.Owner = usersRepository.get(instance.OwnerId);
        instance.OwnerName = instance.Owner.Name;
        return instance;
    }
}