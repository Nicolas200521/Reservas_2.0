
let reservas = [
  {
    id: 1,
    cancha: 'Cancha 1',
    fecha: '2024-01-15',
    hora: '18:00',
    duracion: 90,
    usuarioId: 1,
    estado: 'confirmada',
    createdAt: new Date().toISOString()
  }
];

/**
 * @desc    Obtener todas las reservas
 * @route   GET /api/reservas/all
 */
export const getAllReservas = async (req, res) => {
  res.json(reservas);
};

/**
 * @desc    Obtener una reserva por ID
 * @route   GET /api/reservas/:id
 */
export const getReservaById = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = reservas.find(r => r.id === parseInt(id));
    
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    res.json(reserva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Crear una nueva reserva
 * @route   POST /api/reservas
 */
export const createReserva = async (req, res) => {
  try {
    const { cancha, fecha, hora, duracion, usuarioId } = req.body;

    // Validación
    if (!cancha || !fecha || !hora || !duracion) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    // Verificar disponibilidad (ejemplo educativo)
    const conflicto = reservas.find(r => 
      r.cancha === cancha && 
      r.fecha === fecha && 
      r.hora === hora &&
      r.estado !== 'cancelada'
    );

    if (conflicto) {
      return res.status(400).json({ 
        error: 'La cancha ya está reservada en ese horario' 
      });
    }

    // Crear nueva reserva
    const nuevaReserva = {
      id: reservas.length + 1,
      cancha,
      fecha,
      hora,
      duracion,
      usuarioId: usuarioId || 1,
      estado: 'confirmada',
      createdAt: new Date().toISOString()
    };

    reservas.push(nuevaReserva);

    res.status(201).json({
      message: 'Reserva creada exitosamente',
      reserva: nuevaReserva
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Actualizar una reserva
 * @route   PUT /api/reservas/:id
 */
export const updateReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancha, fecha, hora, duracion, estado } = req.body;

    const reservaIndex = reservas.findIndex(r => r.id === parseInt(id));

    if (reservaIndex === -1) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Actualizar reserva
    reservas[reservaIndex] = {
      ...reservas[reservaIndex],
      ...(cancha && { cancha }),
      ...(fecha && { fecha }),
      ...(hora && { hora }),
      ...(duracion && { duracion }),
      ...(estado && { estado }),
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Reserva actualizada exitosamente',
      reserva: reservas[reservaIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Eliminar una reserva
 * @route   DELETE /api/reservas/:id
 */
export const deleteReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const reservaIndex = reservas.findIndex(r => r.id === parseInt(id));

    if (reservaIndex === -1) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reservaEliminada = reservas.splice(reservaIndex, 1)[0];

    res.json({
      message: 'Reserva eliminada exitosamente',
      reserva: reservaEliminada
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

