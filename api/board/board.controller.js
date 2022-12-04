const logger = require('../../services/logger.service')
const boardService = require('./board.service')
const userService = require('../user/user.service');
const socketService = require('../../services/socket.service')


module.exports = {
  getBoards,
  getBoardById,
  addBoard,
  updateBoard,
  removeBoard,
}

// LIST
async function getBoards(req, res) {
  try {
    const filterBy = req.query
    filterBy.currUser = req.session.user;
    const boards = await boardService.query(filterBy)
    res.json(boards)
  } catch (err) {
    logger.error('Failed to get boards', err)
    res.status(500).send({ err: 'Failed to get boards' })
  }
}

// READ
async function getBoardById(req, res) {
  try {
    const { id } = req.params
    const board = await boardService.getById(id)
    userService.addRecentBoard(id, req.session.user._id);
    res.json(board)
  } catch (err) {
    logger.error('Failed to get toy', err)
    res.status(500).send({ err: 'Failed to get board by Id' })
  }
}

// CREATE
async function addBoard(req, res) {
  try {
    const board = req.body;
    const addedBoard = await boardService.add(board);
    res.json(addedBoard)
  } catch (err) {
    logger.error('Failed to add toy', err)
    res.status(500).send({ err: 'Failed to add board' })
  }
}

// UPDATE
async function updateBoard(req, res) {
  try {
    const board = req.body;
    const updatedBoard = await boardService.update(board);
    socketService.emitTo({ type: 'board update', data: board })
    res.json(updatedBoard);
  } catch (err) {
    logger.error('Failed to update toy', err)
    res.status(500).send({ err: 'Failed to update board' });
  }
}

// DELETE
async function removeBoard(req, res) {
  try {
    const { id } = req.params
    const removedId = await boardService.remove(id)
    res.send(removedId)
  } catch (err) {
    // logger.error('Failed to remove toy', err)
    res.status(500).send({ err: 'Failed to remove board' })
  }
}
