const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const { ObjectId } = require('mongodb')

module.exports = {
  query,
  getById,
  getByUsername,
  add,
  addActivity,
  addRecentBoard,
  update
}

async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy)
  try {
    const collection = await dbService.getCollection('user')
    var users = await collection.find().toArray()
    users = users.map((user) => {
      delete user.password
      return user
    })
    return users
  } catch (err) {
    logger.error('cannot find users', err)
    throw err
  }
}

async function getById(userId) {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ _id: ObjectId(userId) })
    delete user.password
    return user
  } catch (err) {
    logger.error(`while finding user ${userId}`, err)
    throw err
  }
}

async function getByUsername(username) {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ username })
    return user
  } catch (err) {
    logger.error(`while finding user ${username}`, err)
    throw err
  }
}

async function addActivity(userId, activity) {
  try {
    const user = await getById(userId);
    const userToSave = {
      _id: ObjectId(user._id),
      username: user.username,
      fullname: user.fullname,
      imgUrl: user.imgUrl,
      activities: user.activities,
      recentBoards: user.recentBoards,
      isReaden: false,
    }

    const { byMemberId, txt, taskId, groupId, toMemberId, boardId, isReaden } = activity;

    const activityToSave = {
      byMemberId,
      txt,
      taskId,
      groupId,
      createdAt: Date.now(),
      toMemberId,
      boardId,
      isReaden
    }

    userToSave.activities.unshift(activityToSave);
    const collection = await dbService.getCollection('user');
    await collection.updateOne({ _id: userToSave._id }, { $set: userToSave });
    return userToSave;
  } catch (err) {
    throw err;
  }
}

async function addRecentBoard(boardId, userId) {
  try {
    const user = await getById(userId);
    const userToSave = {
      _id: ObjectId(user._id),
      username: user.username,
      fullname: user.fullname,
      imgUrl: user.imgUrl,
      activities: user.activities,
      recentBoards: user.recentBoards,
      favorites: user.favorites
    }

    if (userToSave.recentBoards.includes(boardId)) {
      const idx = userToSave.recentBoards.findIndex(id => id === boardId);
      userToSave.recentBoards.splice(idx, 1);
    }

    userToSave.recentBoards.unshift(boardId);
    userToSave.recentBoards = userToSave.recentBoards.slice(0, 5); // saving only the 5 most recent ones
    const collection = await dbService.getCollection('user');
    await collection.updateOne({ _id: userToSave._id }, { $set: userToSave });
    return userToSave;
  } catch (err) {
    throw err;
  }
}


// async function remove(userId) {
//   try {
//     const collection = await dbService.getCollection('user')
//     await collection.deleteOne({ _id: ObjectId(userId) })
//   } catch (err) {
//     logger.error(`cannot remove user ${userId}`, err)
//     throw err
//   }
// }

async function update(user) {
  try {
    // peek only updatable fields!
    const userToSave = {
      _id: ObjectId(user._id),
      username: user.username,
      fullname: user.fullname,
      imgUrl: user.imgUrl,
      activities: user.activities,
      recentBoards: user.recentBoards,
      favorites: user.favorites
    }
    const collection = await dbService.getCollection('user')
    await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
    return userToSave
  } catch (err) {
    logger.error(`cannot update user ${user._id}`, err)
    throw err
  }
}

async function add(user) {
  try {
    // peek only updatable fields!
    const userToAdd = {
      username: user.username,
      password: user.password,
      fullname: user.fullname,
      imgUrl: user.imgUrl,
      activities: [],
      recentBoards: [],
      favorites: []
    }

    const collection = await dbService.getCollection('user')
    await collection.insertOne(userToAdd)
    return userToAdd
  } catch (err) {
    logger.error('cannot insert user', err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  const criteria = {}
  if (filterBy.txt) {
    const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
    criteria.$or = [
      {
        username: txtCriteria,
      },
      {
        fullname: txtCriteria,
      },
    ]
  }
  if (filterBy.minBalance) {
    criteria.balance = { $gte: filterBy.minBalance }
  }
  return criteria
}
