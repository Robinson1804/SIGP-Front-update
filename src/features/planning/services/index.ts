/**
 * Planning Services - Export all planning-related services
 */

// PGD Service
export {
  getPGDs,
  getPGDActivo,
  getPGDById,
  getPGDWithStats,
  getPGDStats,
  createPGD,
  updatePGD,
  deletePGD,
  togglePGDActivo,
  getPGDDashboard,
  exportPGDToPDF,
  exportPGDToExcel,
  downloadPGDExport,
} from './pgd.service';

// OEI Service
export {
  getOEIs,
  getOEIsByPGD,
  getOEIById,
  createOEI,
  updateOEI,
  deleteOEI,
  toggleOEIActivo,
} from './oei.service';

// OGD Service
export {
  getOGDs,
  getOGDsByPGD,
  getOGDById,
  createOGD,
  updateOGD,
  deleteOGD,
  toggleOGDActivo,
} from './ogd.service';

// OEGD Service
export {
  getOEGDs,
  getOEGDsByPGD,
  getOEGDsByOGD,
  getOEGDById,
  createOEGD,
  updateOEGD,
  deleteOEGD,
  toggleOEGDActivo,
} from './oegd.service';

// Acciones Estratégicas Service
export {
  getAccionesEstrategicas,
  getAccionesEstrategicasByPGD,
  getAccionesEstrategicasByOEGD,
  getAccionEstrategicaById,
  createAccionEstrategica,
  updateAccionEstrategica,
  deleteAccionEstrategica,
  getProyectosByAccionEstrategica,
  getActividadesByAccionEstrategica,
  toggleAccionEstrategicaActivo,
  getAccionEstrategicaWithPOI,
} from './acciones-estrategicas.service';
