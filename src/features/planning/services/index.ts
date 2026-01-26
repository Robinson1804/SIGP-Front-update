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
  getNextOEICodigo,
} from './oei.service';

// AEI Service (NEW)
export {
  getAEIs,
  getAEIsByOEI,
  getAEIById,
  createAEI,
  updateAEI,
  deleteAEI,
  toggleAEIActivo,
  getNextAEICodigo,
} from './aei.service';

// OGD Service
export {
  getOGDs,
  getOGDsByPGD,
  getOGDById,
  createOGD,
  updateOGD,
  deleteOGD,
  toggleOGDActivo,
  getNextOGDCodigo,
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
  getNextOEGDCodigo,
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
  getNextAECodigo,
} from './acciones-estrategicas.service';
