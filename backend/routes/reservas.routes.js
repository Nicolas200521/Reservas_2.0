import express from 'express';
import { 
  getAllReservas, 
  createReserva, 
  updateReserva, 
  deleteReserva,
  getReservaById 
} from '../controllers/reservas.controller.js';

const router = express.Router();

/**
 * @route   GET /api/reservas
 * @desc    Obtener todas las reservas
 * @access  Private
 */
router.get('/', getAllReservas);

/**
 * @route   GET /api/reservas/:id
 * @desc    Obtener una reserva por ID
 * @access  Private
 */
router.get('/:id', getReservaById);

/**
 * @route   POST /api/reservas
 * @desc    Crear una nueva reserva
 * @access  Private
 */
router.post('/', createReserva);

/**
 * @route   PUT /api/reservas/:id
 * @desc    Actualizar una reserva
 * @access  Private
 */
router.put('/:id', updateReserva);

/**
 * @route   DELETE /api/reservas/:id
 * @desc    Eliminar una reserva
 * @access  Private
 */
router.delete('/:id', deleteReserva);

export default router;

