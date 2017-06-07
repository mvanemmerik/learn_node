const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFiler(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'Wrong file type.' }, false)
    }
  },
}

exports.homePage = (req, res) => {
  res.render('index', {
    title: 'Learning Node',
    name: 'monty',
    dog: 'lacey',
  });
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
}

exports.createStore = async (req, res) => {
  req.body.author = req.user.id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `${store.name} created.`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores })
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user.id)) {
    throw Error('A store can only be editted by it\'s owner.');
  }
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  confirmOwner(store, req.user);
  res.render('editStore', { title: `Edit ${store.name}`, store });
}

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  }).exec();
  req.flash('success', `Successfully updated ${store.name}
    <a href="/stores/${store.slug}">View Store</a>`);
  res.redirect(`/stores/${store.id}/edit`);
  };

  exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug }).populate('author');
    if (!store) return next();
    res.render('store', { store, title: store.name });
  }

  exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagsQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagsQuery });
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise])

    res.render('tag', { tags, tag, stores, title: 'Tags' });
  };

  exports.searchStores = async (req, res) => {
    const stores = await Store
    .find({ $text: { $search: req.query.q } }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(5);
    res.json(stores);
  }

  exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: 10000 // 10km
        }
      }
    }
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);
  }

  exports.mapPage = (req, res) => {
    res.render('map', { title: 'Map' });
  }

  exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
    .findByIdAndUpdate(req.user.id,
      { [operator]: { hearts: req.params.id } },
      { new: true }
      );
    res.json(user);
  }

  exports.getHearts = async (req, res) => {
    const stores = await Store.find({ _id: { $in: req.user.hearts } });
    res.render('stores', { title: 'My Favorire Stores', stores });
  }
